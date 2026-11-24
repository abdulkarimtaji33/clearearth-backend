/**
 * Outbound service.
 *
 * Every GRN gets exactly one outbound entry ("Pending Outbound"). It is never created by hand, only edited:
 *   outbound type  disposed | sale | free_service
 *   sale           -> gatepass for a client (company), items, UOM, amount, vehicle, person in charge, description
 *   disposed       -> gatepass for a vendor (supplier), same details
 *   free_service   -> handled as a disposal: vendor + same details
 * Saving a valid type creates the gatepass, marks the entry Completed and releases the stock of an approved GRN.
 * Sales request a delivery date; operations confirm it or ask for another one (same flow as pickup dates).
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const TYPES = ['disposed', 'sale', 'free_service'];
const STATUSES = ['pending_outbound', 'completed'];
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const includes = [
  {
    model: db.Grn, as: 'grn', attributes: ['id', 'grn_number', 'status', 'storage_facility_id', 'driver_comment', 'disposed_without_facility'], required: false,
    include: [{ model: db.StorageFacility, as: 'storageFacility', attributes: ['id', 'name'], required: false }],
  },
  {
    model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title', 'deal_type', 'assigned_to'], required: false,
    include: [
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      { model: db.Lead, as: 'lead', attributes: ['id', 'lead_number', 'company_id'], required: false, include: [{ model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false }] },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  },
  { model: db.WorkOrder, as: 'workOrder', attributes: ['id', 'title', 'status'], required: false },
  { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
  { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
  { model: db.OutboundItem, as: 'items', separate: true, order: [['id', 'ASC']], include: [{ model: db.MaterialType, as: 'materialType', required: false }] },
];

async function nextNumber(tenantId, transaction) {
  const prefix = `OUT-${new Date().getFullYear()}-`;
  const [rows] = await db.sequelize.query(
    'SELECT outbound_number FROM outbounds WHERE tenant_id = ? AND outbound_number LIKE ? ORDER BY outbound_number DESC LIMIT 1',
    { replacements: [tenantId, `${prefix}%`], transaction }
  );
  const last = rows?.[0] ? parseInt(String(rows[0].outbound_number).split('-').pop(), 10) : 0;
  return `${prefix}${String((Number.isFinite(last) ? last : 0) + 1).padStart(4, '0')}`;
}

async function nextGatepassNumber(tenantId, transaction) {
  const prefix = `GP-${new Date().getFullYear()}-`;
  const [rows] = await db.sequelize.query(
    'SELECT gatepass_number FROM outbounds WHERE tenant_id = ? AND gatepass_number LIKE ? ORDER BY gatepass_number DESC LIMIT 1',
    { replacements: [tenantId, `${prefix}%`], transaction }
  );
  const last = rows?.[0] ? parseInt(String(rows[0].gatepass_number).split('-').pop(), 10) : 0;
  return `${prefix}${String((Number.isFinite(last) ? last : 0) + 1).padStart(4, '0')}`;
}

async function addEvent(outboundId, userId, action, detail, transaction) {
  await db.OutboundEvent.create({ outbound_id: outboundId, user_id: userId || null, action, detail: detail || null }, { transaction });
}

/** Creates the outbound entry (status "pending_outbound") for a GRN. Idempotent: returns the existing one. */
async function createForGrn(tenantId, grnId, userId = null, transaction = null) {
  const existing = await db.Outbound.findOne({ where: { tenant_id: tenantId, grn_id: grnId }, transaction });
  if (existing) return existing;
  const grn = await db.Grn.findOne({ where: { id: grnId, tenant_id: tenantId }, transaction });
  if (!grn) throw ApiError.notFound('GRN not found');
  const items = await db.GrnItem.findAll({ where: { grn_id: grnId }, order: [['id', 'ASC']], transaction });
  const dealForCurrency = grn.deal_id ? await db.Deal.findOne({ where: { id: grn.deal_id }, attributes: ['currency'], transaction }) : null;
  const row = await db.Outbound.create({
    tenant_id: tenantId,
    outbound_number: await nextNumber(tenantId, transaction),
    grn_id: grnId,
    deal_id: grn.deal_id || null,
    currency: (dealForCurrency && dealForCurrency.currency) || 'AED',
    work_order_id: grn.work_order_id || null,
    status: 'pending_outbound',
    created_by: userId || grn.created_by || null,
  }, { transaction });
  for (const it of items) {
    await db.OutboundItem.create({
      outbound_id: row.id, grn_item_id: it.id, item_name: it.item_name, material_type_id: it.material_type_id || null,
      unit_of_measure: it.unit_of_measure || 'kg', quantity: it.quantity || 0,
    }, { transaction });
  }
  await addEvent(row.id, userId || grn.created_by, 'created', `Created automatically from ${grn.grn_number}`, transaction);
  return row;
}

/** Migration helper: give every existing GRN its outbound entry. */
async function backfillFromGrns() {
  const [rows] = await db.sequelize.query(
    'SELECT g.id, g.tenant_id FROM grns g LEFT JOIN outbounds o ON o.grn_id = g.id AND o.tenant_id = g.tenant_id WHERE o.id IS NULL ORDER BY g.id'
  );
  for (const g of rows) await createForGrn(g.tenant_id, g.id, null);
  if (rows.length) console.log(`  Created ${rows.length} outbound entr${rows.length === 1 ? 'y' : 'ies'} for existing GRNs`);
  return rows.length;
}

const list = async (tenantId, filters = {}) => {
  const { offset, limit, search, status, type, dealId, from, to } = filters;
  const where = { tenant_id: tenantId };
  if (status && STATUSES.includes(status)) where.status = status;
  if (type && TYPES.includes(type)) where.outbound_type = type;
  if (dealId) where.deal_id = dealId;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = `${from} 00:00:00`;
    if (to) where.created_at[Op.lte] = `${to} 23:59:59`;
  }
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [
      { outbound_number: { [Op.like]: s } },
      { gatepass_number: { [Op.like]: s } },
      { vehicle_no: { [Op.like]: s } },
      { '$grn.grn_number$': { [Op.like]: s } },
      { '$deal.deal_number$': { [Op.like]: s } },
      { '$deal.title$': { [Op.like]: s } },
    ];
  }
  const { count, rows } = await db.Outbound.findAndCountAll({ where, include: includes, subQuery: false, offset, limit, order: [['id', 'DESC']], distinct: true });
  return { rows: rows.map((r) => r.get({ plain: true })), total: count };
};

const getById = async (tenantId, id) => {
  const row = await db.Outbound.findOne({ where: { id, tenant_id: tenantId }, include: includes });
  if (!row) throw ApiError.notFound('Outbound entry not found');
  const plain = row.get({ plain: true });
  plain.events = (await db.OutboundEvent.findAll({
    where: { outbound_id: id }, order: [['id', 'DESC']],
    include: [{ model: db.User, as: 'user', attributes: ['id', 'first_name', 'last_name'], required: false }],
  })).map((e) => e.get({ plain: true }));
  plain.total_value = round2((plain.items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_value) || 0), 0));
  return plain;
};

function cleanItems(items) {
  return (Array.isArray(items) ? items : []).map((it) => ({
    id: it.id || null,
    grn_item_id: it.grnItemId || it.grn_item_id || null,
    item_name: String(it.itemName || it.item_name || '').trim(),
    material_type_id: it.materialTypeId || it.material_type_id || null,
    unit_of_measure: String(it.unitOfMeasure || it.unit_of_measure || '').trim() || null,
    quantity: Number(it.quantity),
    unit_value: it.unitValue ?? it.unit_value ?? null,
    notes: it.notes || null,
  }));
}

function assertComplete({ type, companyId, supplierId, vehicleNo, personInCharge, items, isFoc }) {
  if (type === 'sale' && !companyId) throw ApiError.badRequest('Select the client for this sale');
  if ((type === 'disposed' || type === 'free_service') && !supplierId) throw ApiError.badRequest('Select the vendor for this gatepass');
  if (!String(vehicleNo || '').trim()) throw ApiError.badRequest('Enter the vehicle number');
  if (!String(personInCharge || '').trim()) throw ApiError.badRequest('Enter the person in charge');
  if (!items.length) throw ApiError.badRequest('Add at least one item');
  for (const it of items) {
    if (!it.item_name) throw ApiError.badRequest('Every line needs an item');
    if (!it.unit_of_measure) throw ApiError.badRequest(`Select the unit of measure for ${it.item_name}`);
    if (!Number.isFinite(it.quantity) || it.quantity <= 0) throw ApiError.badRequest(`Enter the amount for ${it.item_name}`);
    // Free-of-cost stock is received without a value; it needs a Value of Material (VoM) before it can be resold.
    if (isFoc && type === 'sale' && !(Number(it.unit_value) > 0)) throw ApiError.badRequest(`Enter the Value of Material (VoM) per unit for ${it.item_name} before selling free-of-cost stock`);
  }
}

async function releaseInventory(tenantId, outbound, items, transaction) {
  const grn = await db.Grn.findOne({ where: { id: outbound.grn_id, tenant_id: tenantId }, attributes: ['id', 'status'], transaction });
  if (!grn || grn.status !== 'approved') return false; // stock only exists once the GRN is approved
  for (const it of items) {
    if (!it.material_type_id || !(it.quantity > 0)) continue;
    const inv = await db.Inventory.findOne({ where: { tenant_id: tenantId, warehouse_id: 1, material_type_id: it.material_type_id }, transaction });
    if (!inv) continue;
    const next = Math.max(0, round2(parseFloat(inv.total_quantity || 0) - it.quantity));
    await inv.update({ total_quantity: next, last_updated: new Date() }, { transaction });
  }
  return true;
}

const update = async (tenantId, id, body, actor = {}) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await db.Outbound.findOne({ where: { id, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!row) throw ApiError.notFound('Outbound entry not found');
    const completed = row.status === 'completed';
    const patch = { updated_by: actor.userId || null };
    const log = [];

    for (const [k, col] of [['vehicleNo', 'vehicle_no'], ['personInCharge', 'person_in_charge'], ['description', 'description'], ['notes', 'notes']]) {
      if (body[k] !== undefined) patch[col] = String(body[k] ?? '').trim() || null;
    }

    if (completed) {
      if (body.outboundType !== undefined && body.outboundType !== row.outbound_type) {
        throw ApiError.badRequest('The gatepass is already issued, so the type cannot be changed');
      }
      await row.update(patch, { transaction: t });
      await addEvent(row.id, actor.userId, 'updated', 'Vehicle / person in charge / description updated', t);
    } else {
      const type = body.outboundType !== undefined ? (body.outboundType || null) : row.outbound_type;
      if (type && !TYPES.includes(type)) throw ApiError.badRequest('Outbound type must be disposed, sale or free service');
      patch.outbound_type = type;
      if (body.companyId !== undefined) patch.company_id = body.companyId || null;
      if (body.supplierId !== undefined) patch.supplier_id = body.supplierId || null;
      if (type === 'sale') patch.supplier_id = null;
      if (type === 'disposed' || type === 'free_service') patch.company_id = null;

      let items = null;
      if (body.items !== undefined) {
        items = cleanItems(body.items);
        await db.OutboundItem.destroy({ where: { outbound_id: row.id }, transaction: t });
        for (const it of items) {
          await db.OutboundItem.create({
            outbound_id: row.id, grn_item_id: it.grn_item_id, item_name: it.item_name || 'Item', material_type_id: it.material_type_id,
            unit_of_measure: it.unit_of_measure, quantity: Number.isFinite(it.quantity) ? it.quantity : 0,
            unit_value: it.unit_value === '' || it.unit_value == null ? null : Number(it.unit_value), notes: it.notes,
          }, { transaction: t });
        }
      }

      if (type) {
        const stored = (await db.OutboundItem.findAll({ where: { outbound_id: row.id }, order: [['id', 'ASC']], transaction: t })).map((i) => i.get({ plain: true }));
        const merged = { ...row.get({ plain: true }), ...patch };
        const deal = merged.deal_id ? await db.Deal.findOne({ where: { id: merged.deal_id, tenant_id: tenantId }, attributes: ['id', 'deal_type'], transaction: t }) : null;
        assertComplete({
          type, companyId: merged.company_id, supplierId: merged.supplier_id, vehicleNo: merged.vehicle_no,
          personInCharge: merged.person_in_charge, items: stored.map((i) => ({ ...i, quantity: Number(i.quantity) })),
          isFoc: deal?.deal_type === 'free_of_charge',
        });
        patch.gatepass_number = await nextGatepassNumber(tenantId, t);
        patch.gatepass_date = new Date().toISOString().slice(0, 10);
        patch.status = 'completed';
        patch.completed_at = new Date();
        patch.inventory_released = await releaseInventory(tenantId, row, stored.map((i) => ({ ...i, quantity: Number(i.quantity) })), t);
        log.push(['gatepass_issued', `${patch.gatepass_number} (${type.replace('_', ' ')})`]);
      } else {
        log.push(['updated', 'Details saved']);
      }
      await row.update(patch, { transaction: t });
      for (const [a, d] of log) await addEvent(row.id, actor.userId, a, d, t);
    }
    await t.commit();
    return getById(tenantId, id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

// ── Delivery date: sales request, operations confirm or ask for another date ──────────────────────
const requestDelivery = async (tenantId, id, { date, notes }, actor = {}) => {
  if (!date) throw ApiError.badRequest('Choose the delivery date');
  const row = await db.Outbound.findOne({ where: { id, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Outbound entry not found');
  await row.update({
    requested_delivery_date: date, delivery_date_status: 'pending', confirmed_delivery_date: null,
    delivery_reschedule_note: null, delivery_notes: notes ? String(notes).trim() : null, delivery_requested_by: actor.userId || null,
  });
  await addEvent(row.id, actor.userId, 'delivery_requested', `Delivery requested for ${date}${notes ? ` — ${notes}` : ''}`);
  return getById(tenantId, id);
};

const confirmDelivery = async (tenantId, id, actor = {}) => {
  const row = await db.Outbound.findOne({ where: { id, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Outbound entry not found');
  if (!row.requested_delivery_date) throw ApiError.badRequest('No delivery date has been requested');
  await row.update({ delivery_date_status: 'confirmed', confirmed_delivery_date: row.requested_delivery_date, delivery_reschedule_note: null });
  await addEvent(row.id, actor.userId, 'delivery_confirmed', `Delivery confirmed for ${row.requested_delivery_date}`);
  return getById(tenantId, id);
};

const requestReschedule = async (tenantId, id, note, actor = {}) => {
  const row = await db.Outbound.findOne({ where: { id, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Outbound entry not found');
  if (!row.requested_delivery_date) throw ApiError.badRequest('No delivery date has been requested');
  await row.update({ delivery_date_status: 'reschedule_requested', delivery_reschedule_note: note ? String(note).trim() : null });
  await addEvent(row.id, actor.userId, 'delivery_reschedule_requested', note || 'Operations asked for another date');
  return getById(tenantId, id);
};

const pendingCount = (tenantId) => db.Outbound.count({ where: { tenant_id: tenantId, status: 'pending_outbound' } }).catch(() => 0);

module.exports = {
  TYPES, STATUSES, createForGrn, backfillFromGrns, list, getById, update,
  requestDelivery, confirmDelivery, requestReschedule, pendingCount,
};
