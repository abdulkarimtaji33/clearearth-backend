/**
 * Warehouse material tracking: every GRN line becomes a batch that is tagged, located, segregated (split into child
 * batches), processed and traced to its final outcome, with the full movement history kept.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

const { Op } = db.Sequelize;

const DEFAULT_TAGS = [
  ['material_type', ['E-Waste', 'Laptop', 'Mobile Phone', 'PCB', 'Metal', 'Plastic', 'Battery']],
  ['condition', ['Pending Inspection', 'Reusable', 'Needs Repair', 'Damaged', 'For Recycling']],
  ['action', ['Inspect', 'Refurbish', 'Dismantle', 'Recycle', 'Ready for Sale', 'For Destruction']],
  ['special', ['Data Destruction Required', 'Hazardous Handling', 'Customer Hold']],
];
const BLOCKING_TAGS = ['Customer Hold'];
const TAG_GROUPS = ['material_type', 'condition', 'action', 'special'];

/** Formal workflow stage (a status), as opposed to a tag which only describes the material. */
const STATUSES = {
  inspection_pending: 'Inspection pending',
  inspected: 'Inspected',
  in_refurbishment: 'In refurbishment',
  in_dismantling: 'In dismantling',
  in_recycling: 'In recycling',
  ready_for_sale: 'Ready for sale',
  for_destruction: 'For destruction',
  destroyed: 'Destroyed',
  sold: 'Sold',
  transferred: 'Transferred',
  disposed: 'Disposed',
};

/** Segregation categories chosen when splitting a batch (or on inspection). */
const CATEGORIES = {
  reusable: { label: 'Good / reusable', status: 'inspected', tag: 'Reusable' },
  refurbishable: { label: 'Refurbishable', status: 'in_refurbishment', tag: 'Refurbish' },
  dismantling: { label: 'For dismantling', status: 'in_dismantling', tag: 'Dismantle' },
  recyclable: { label: 'Recyclable', status: 'in_recycling', tag: 'Recycle' },
  destruction: { label: 'For destruction', status: 'for_destruction', tag: 'For Destruction' },
};

/** Actions the employee can confirm after scanning a label. 'to' is the resulting status (null = unchanged). */
const ACTIONS = {
  inspect: { label: 'Record inspection', to: 'inspected', from: ['inspection_pending'] },
  refurbish: { label: 'Send to refurbishment', to: 'in_refurbishment', from: ['inspected', 'inspection_pending'] },
  dismantle: { label: 'Send to dismantling', to: 'in_dismantling', from: ['inspected', 'inspection_pending'] },
  recycle: { label: 'Send to recycling', to: 'in_recycling', from: ['inspected', 'inspection_pending'] },
  destroy: { label: 'Send for destruction', to: 'for_destruction', from: ['inspected', 'inspection_pending'] },
  destruction_done: { label: 'Mark as destroyed', to: 'destroyed', from: ['for_destruction'] },
  ready_for_sale: { label: 'Mark ready for sale', to: 'ready_for_sale', from: ['inspected', 'in_refurbishment', 'in_dismantling'] },
  sell: { label: 'Record sale', to: 'sold', from: ['ready_for_sale', 'inspected'] },
  transfer: { label: 'Transfer out', to: 'transferred', from: ['inspected', 'ready_for_sale', 'in_refurbishment', 'in_dismantling', 'in_recycling'] },
  dispose: { label: 'Record disposal', to: 'disposed', from: ['in_recycling', 'in_dismantling', 'destroyed', 'inspected'] },
  move: { label: 'Move to another location', to: null, from: null },
};
const FINAL = ['sold', 'transferred', 'disposed', 'destroyed'];
// With "Data Destruction Required" the material cannot leave or be sold until it has been destroyed.
const NEEDS_DESTRUCTION_FIRST = ['ready_for_sale', 'sell', 'transfer', 'dispose', 'refurbish'];

const tagInclude = { model: db.WarehouseTag, as: 'tags', attributes: ['id', 'name', 'tag_group', 'blocks_processing'], through: { attributes: [] }, required: false };

const ensureDefaultTags = async (tenantId) => {
  const count = await db.WarehouseTag.count({ where: { tenant_id: tenantId } });
  if (count > 0) return;
  const rows = [];
  DEFAULT_TAGS.forEach(([group, names]) => names.forEach((name) => rows.push({ tenant_id: tenantId, name, tag_group: group, blocks_processing: BLOCKING_TAGS.includes(name) })));
  await db.WarehouseTag.bulkCreate(rows, { ignoreDuplicates: true });
};

const listTags = async (tenantId) => {
  await ensureDefaultTags(tenantId);
  return db.WarehouseTag.findAll({ where: { tenant_id: tenantId, is_active: true }, order: [['tag_group', 'ASC'], ['name', 'ASC']] });
};

const createTag = async (tenantId, { name, tagGroup, blocksProcessing }) => {
  const n = String(name || '').trim();
  if (!n) throw ApiError.badRequest('Tag name is required');
  if (!TAG_GROUPS.includes(tagGroup)) throw ApiError.badRequest('Choose a tag group');
  const dup = await db.WarehouseTag.findOne({ where: { tenant_id: tenantId, name: n } });
  if (dup) throw ApiError.badRequest('A tag with this name already exists');
  return db.WarehouseTag.create({ tenant_id: tenantId, name: n.slice(0, 80), tag_group: tagGroup, blocks_processing: Boolean(blocksProcessing) && tagGroup === 'special' });
};

const tagByName = async (tenantId, name, transaction) => db.WarehouseTag.findOne({ where: { tenant_id: tenantId, name }, transaction });

const logMovement = (tenantId, batchId, data, userId, transaction) => db.WarehouseMovement.create({
  tenant_id: tenantId, batch_id: batchId, user_id: userId || null, ...data,
}, { transaction });

/** Receipt / batch references come from the GRN number: GRN-2026-0007 -> INW-2026-0007 / BATCH-2026-0007-1. */
const codesFor = (grn, index, count) => {
  const tail = String(grn.grn_number || `${grn.id}`).replace(/^GRN-?/i, '');
  return { receipt: `INW-${tail}`, batch: count > 1 || index > 0 ? `BATCH-${tail}-${index + 1}` : `BATCH-${tail}-1` };
};

/** One batch per GRN line, created when the GRN is approved (idempotent: lines that already have a batch are skipped). */
const createForGrn = async (tenantId, grnId, userId = null) => {
  await ensureDefaultTags(tenantId);
  const grn = await db.Grn.findOne({
    where: { id: grnId, tenant_id: tenantId },
    include: [
      { model: db.GrnItem, as: 'items', include: [{ model: db.MaterialType, as: 'materialType', required: false }] },
      { model: db.Deal, as: 'deal', required: false, include: [{ model: db.Company, as: 'company', attributes: ['company_name'], required: false }] },
      { model: db.StorageFacility, as: 'storageFacility', attributes: ['name'], required: false },
    ],
    order: [[{ model: db.GrnItem, as: 'items' }, 'id', 'ASC']],
  });
  if (!grn || !grn.items?.length) return 0;
  const pending = await tagByName(tenantId, 'Pending Inspection');
  const ewaste = await tagByName(tenantId, 'E-Waste');
  let created = 0;
  for (let i = 0; i < grn.items.length; i++) {
    const item = grn.items[i];
    const exists = await db.WarehouseBatch.findOne({ where: { tenant_id: tenantId, grn_item_id: item.id, parent_batch_id: null } });
    if (exists) continue;
    const codes = codesFor(grn, i, grn.items.length);
    const batch = await db.WarehouseBatch.create({
      tenant_id: tenantId,
      batch_code: codes.batch,
      receipt_code: codes.receipt,
      grn_id: grn.id,
      grn_item_id: item.id,
      deal_id: grn.deal_id || null,
      customer_name: grn.deal?.company?.company_name || null,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure,
      status: 'inspection_pending',
      location: grn.storageFacility?.name || null,
      received_at: grn.approved_at || new Date(),
      created_by: userId,
    });
    const tags = [pending, ewaste].filter(Boolean);
    const typeName = item.materialType?.display_name;
    if (typeName) {
      const match = await tagByName(tenantId, typeName);
      if (match) tags.push(match);
    }
    if (tags.length) await db.WarehouseBatchTag.bulkCreate(tags.map((t) => ({ batch_id: batch.id, tag_id: t.id })), { ignoreDuplicates: true });
    await logMovement(tenantId, batch.id, { action: 'received', quantity: item.quantity, to_status: 'inspection_pending', to_location: batch.location, notes: `Received on ${grn.grn_number}` }, userId);
    created++;
  }
  return created;
};

/** Backfill batches for GRNs that were approved before warehouse tracking existed (idempotent). */
const backfillFromGrns = async () => {
  const grns = await db.Grn.findAll({ where: { status: 'approved' }, attributes: ['id', 'tenant_id'], order: [['id', 'ASC']] });
  let n = 0;
  for (const g of grns) n += await createForGrn(g.tenant_id, g.id, null);
  return n;
};

const plain = (b) => (b && b.get ? b.get({ plain: true }) : b);

const decorate = (row) => {
  const b = plain(row);
  const tags = b.tags || [];
  b.blocked = tags.some((t) => t.blocks_processing);
  b.data_destruction_required = tags.some((t) => t.name === 'Data Destruction Required');
  b.status_label = STATUSES[b.status] || b.status;
  return b;
};

const batchWhere = (tenantId, f = {}) => {
  const where = { tenant_id: tenantId };
  if (f.status) where.status = f.status;
  if (f.location) where.location = { [Op.like]: `%${f.location}%` };
  if (f.customer) where.customer_name = { [Op.like]: `%${f.customer}%` };
  if (f.batch) where.batch_code = { [Op.like]: `%${f.batch}%` };
  if (f.search) {
    const s = `%${String(f.search).trim()}%`;
    where[Op.or] = [{ batch_code: { [Op.like]: s } }, { receipt_code: { [Op.like]: s } }, { item_name: { [Op.like]: s } }, { customer_name: { [Op.like]: s } }];
  }
  if (f.dateFrom || f.dateTo) {
    where.received_at = {};
    if (f.dateFrom) where.received_at[Op.gte] = new Date(`${String(f.dateFrom).slice(0, 10)}T00:00:00`);
    if (f.dateTo) where.received_at[Op.lte] = new Date(`${String(f.dateTo).slice(0, 10)}T23:59:59`);
  }
  return where;
};

const list = async (tenantId, filters = {}) => {
  const { offset, limit, tagId, condition, blocked } = filters;
  const where = batchWhere(tenantId, filters);
  const tagIds = [tagId, condition].filter(Boolean);
  let idFilter = null;
  if (tagIds.length) {
    for (const t of tagIds) {
      const rows = await db.WarehouseBatchTag.findAll({ where: { tag_id: t }, attributes: ['batch_id'], raw: true });
      const ids = rows.map((r) => r.batch_id);
      idFilter = idFilter ? idFilter.filter((x) => ids.includes(x)) : ids;
    }
  }
  if (blocked === '1' || blocked === 'true') {
    const rows = await db.sequelize.query(
      'SELECT DISTINCT bt.batch_id FROM warehouse_batch_tags bt JOIN warehouse_tags t ON t.id = bt.tag_id WHERE t.blocks_processing = 1 AND t.tenant_id = ?',
      { replacements: [tenantId], type: db.sequelize.QueryTypes.SELECT }
    );
    const ids = rows.map((r) => r.batch_id);
    idFilter = idFilter ? idFilter.filter((x) => ids.includes(x)) : ids;
  }
  if (idFilter) where.id = idFilter.length ? { [Op.in]: idFilter } : { [Op.in]: [0] };
  const { count, rows } = await db.WarehouseBatch.findAndCountAll({
    where, include: [tagInclude], distinct: true, offset, limit, order: [['id', 'DESC']],
  });
  return { batches: rows.map(decorate), total: count };
};

const getById = async (tenantId, id) => {
  const row = await db.WarehouseBatch.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      tagInclude,
      { model: db.WarehouseBatch, as: 'children', required: false, include: [tagInclude] },
      { model: db.WarehouseBatch, as: 'parent', required: false, attributes: ['id', 'batch_code'] },
      { model: db.Grn, as: 'grn', required: false, attributes: ['id', 'grn_number'] },
    ],
  });
  if (!row) throw ApiError.notFound('Batch not found');
  const batch = decorate(row);
  batch.children = (batch.children || []).map(decorate);
  const moves = await db.WarehouseMovement.findAll({
    where: { tenant_id: tenantId, batch_id: id },
    include: [{ model: db.User, as: 'user', attributes: ['id', 'first_name', 'last_name'], required: false }],
    order: [['id', 'DESC']],
  });
  batch.movements = moves.map((m) => m.get({ plain: true }));
  const allocated = batch.children.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
  batch.allocated_quantity = allocated;
  batch.unallocated_quantity = Math.max(0, (Number(batch.quantity) || 0) - allocated);
  batch.available_actions = availableActions(batch);
  return batch;
};

const availableActions = (batch) => {
  if (FINAL.includes(batch.status) && batch.status !== 'destroyed') return ['move'];
  return Object.entries(ACTIONS)
    .filter(([key, a]) => {
      if (key === 'move') return true;
      if (a.from && !a.from.includes(batch.status)) return false;
      if (batch.data_destruction_required && NEEDS_DESTRUCTION_FIRST.includes(key)) return false;
      return true;
    })
    .map(([key]) => key);
};

const scan = async (tenantId, code) => {
  const c = String(code || '').trim();
  if (!c) throw ApiError.badRequest('Scan or type a batch code');
  const row = await db.WarehouseBatch.findOne({ where: { tenant_id: tenantId, [Op.or]: [{ batch_code: c }, { receipt_code: c }] }, attributes: ['id'] });
  if (!row) throw ApiError.notFound('No material found for this code');
  return getById(tenantId, row.id);
};

const loadBatch = async (tenantId, id) => {
  const b = await db.WarehouseBatch.findOne({ where: { id, tenant_id: tenantId }, include: [tagInclude] });
  if (!b) throw ApiError.notFound('Batch not found');
  return b;
};

const addTag = async (tenantId, id, tagId, user) => {
  const batch = await loadBatch(tenantId, id);
  const tag = await db.WarehouseTag.findOne({ where: { id: tagId, tenant_id: tenantId } });
  if (!tag) throw ApiError.notFound('Tag not found');
  await db.WarehouseBatchTag.findOrCreate({ where: { batch_id: batch.id, tag_id: tag.id } });
  await logMovement(tenantId, batch.id, { action: 'tag_added', notes: tag.name }, user?.id);
  return getById(tenantId, id);
};

const removeTag = async (tenantId, id, tagId, user, canRelease) => {
  const batch = await loadBatch(tenantId, id);
  const tag = await db.WarehouseTag.findOne({ where: { id: tagId, tenant_id: tenantId } });
  if (!tag) throw ApiError.notFound('Tag not found');
  if (tag.blocks_processing && !canRelease) throw ApiError.forbidden(`Only a manager can remove the "${tag.name}" tag`);
  await db.WarehouseBatchTag.destroy({ where: { batch_id: batch.id, tag_id: tag.id } });
  await logMovement(tenantId, batch.id, { action: 'tag_removed', notes: tag.name }, user?.id);
  return getById(tenantId, id);
};

const swapConditionTag = async (tenantId, batchId, tagName, transaction) => {
  const pending = await tagByName(tenantId, 'Pending Inspection', transaction);
  if (pending && tagName !== 'Pending Inspection') await db.WarehouseBatchTag.destroy({ where: { batch_id: batchId, tag_id: pending.id }, transaction });
};

/** Confirm an action (inspect, move to refurbishment, record sale ...) on a batch. */
const performAction = async (tenantId, id, user, body, canAuthorize) => {
  const { action, quantity, location, notes, condition } = body || {};
  const def = ACTIONS[action];
  if (!def) throw ApiError.badRequest('Choose an action');
  const batch = await loadBatch(tenantId, id);
  const b = decorate(batch);
  if (b.blocked && action !== 'move' && !canAuthorize) {
    throw ApiError.forbidden('This material is on hold (Customer Hold). A manager must authorize processing or remove the hold first.');
  }
  if (!availableActions(b).includes(action)) {
    throw ApiError.badRequest(
      b.data_destruction_required && NEEDS_DESTRUCTION_FIRST.includes(action)
        ? 'Data destruction is required first: send the material for destruction and mark it destroyed before this step.'
        : `"${def.label}" is not allowed while the material is "${STATUSES[b.status]}"`
    );
  }
  const newLocation = String(location || '').trim() || null;
  if (action === 'move' && !newLocation) throw ApiError.badRequest('Enter the new location');
  const qty = quantity === undefined || quantity === null || quantity === '' ? null : Number(quantity);
  if (qty !== null && (!(qty > 0) || qty > Number(batch.quantity))) throw ApiError.badRequest('Quantity must be more than zero and not above the batch quantity');

  await db.sequelize.transaction(async (t) => {
    const patch = {};
    if (def.to) patch.status = def.to;
    if (newLocation) patch.location = newLocation.slice(0, 120);
    if (Object.keys(patch).length) await batch.update(patch, { transaction: t });
    if (action === 'inspect') {
      const cond = condition && (await db.WarehouseTag.findOne({ where: { id: condition, tenant_id: tenantId, tag_group: 'condition' }, transaction: t }));
      if (cond) await db.WarehouseBatchTag.findOrCreate({ where: { batch_id: batch.id, tag_id: cond.id }, transaction: t });
      await swapConditionTag(tenantId, batch.id, cond?.name || 'inspected', t);
    }
    await logMovement(tenantId, batch.id, {
      action,
      quantity: qty,
      from_status: b.status,
      to_status: def.to || b.status,
      from_location: b.location,
      to_location: newLocation || b.location,
      notes: String(notes || '').trim() || null,
    }, user?.id, t);
  });
  return getById(tenantId, id);
};

/** Split a batch into groups (e.g. 40 refurbishable, 45 for dismantling, 15 recyclable); each group is a child batch linked to the original. */
const split = async (tenantId, id, user, groups) => {
  const batch = await loadBatch(tenantId, id);
  if (!Array.isArray(groups) || !groups.length) throw ApiError.badRequest('Add at least one group');
  const children = await db.WarehouseBatch.findAll({ where: { tenant_id: tenantId, parent_batch_id: batch.id }, attributes: ['id', 'quantity', 'batch_code'] });
  const allocated = children.reduce((s, c) => s + Number(c.quantity), 0);
  const remaining = Number(batch.quantity) - allocated;
  const parsed = groups.map((g) => ({ category: g.category, quantity: Number(g.quantity), location: String(g.location || '').trim() || null }));
  for (const g of parsed) {
    if (!CATEGORIES[g.category]) throw ApiError.badRequest('Choose a category for every group');
    if (!(g.quantity > 0)) throw ApiError.badRequest('Every group needs a quantity above zero');
  }
  const total = parsed.reduce((s, g) => s + g.quantity, 0);
  if (total > remaining + 0.0001) throw ApiError.badRequest(`The groups add up to ${total} but only ${remaining} ${batch.unit_of_measure || ''} is left to assign`.trim());

  await db.sequelize.transaction(async (t) => {
    const parentTags = await db.WarehouseBatchTag.findAll({ where: { batch_id: batch.id }, transaction: t });
    let seq = children.length;
    for (const g of parsed) {
      seq += 1;
      const cat = CATEGORIES[g.category];
      const child = await db.WarehouseBatch.create({
        tenant_id: tenantId,
        batch_code: `${batch.batch_code}-${String.fromCharCode(64 + ((seq - 1) % 26) + 1)}${seq > 26 ? Math.ceil(seq / 26) : ''}`,
        receipt_code: batch.receipt_code,
        parent_batch_id: batch.id,
        grn_id: batch.grn_id,
        grn_item_id: batch.grn_item_id,
        deal_id: batch.deal_id,
        customer_name: batch.customer_name,
        item_name: batch.item_name,
        quantity: g.quantity,
        unit_of_measure: batch.unit_of_measure,
        status: cat.status,
        location: g.location || batch.location,
        handling_category: g.category,
        received_at: batch.received_at,
        created_by: user?.id || null,
      }, { transaction: t });
      const tagRows = parentTags.map((pt) => ({ batch_id: child.id, tag_id: pt.tag_id }));
      const catTag = await tagByName(tenantId, cat.tag, t);
      if (catTag) tagRows.push({ batch_id: child.id, tag_id: catTag.id });
      await db.WarehouseBatchTag.bulkCreate(tagRows, { ignoreDuplicates: true, transaction: t });
      await logMovement(tenantId, child.id, { action: 'created_by_split', quantity: g.quantity, from_status: batch.status, to_status: cat.status, to_location: child.location, notes: `Split from ${batch.batch_code}: ${cat.label}` }, user?.id, t);
      await logMovement(tenantId, batch.id, { action: 'split', quantity: g.quantity, notes: `${g.quantity} ${batch.unit_of_measure || ''} to ${child.batch_code} (${cat.label})`.trim() }, user?.id, t);
    }
    // The pending-inspection tag and status leave the original once all of it has been assigned.
    if (Math.abs(total - remaining) < 0.0001 && batch.status === 'inspection_pending') {
      await batch.update({ status: 'inspected' }, { transaction: t });
      await swapConditionTag(tenantId, batch.id, 'inspected', t);
      await logMovement(tenantId, batch.id, { action: 'inspect', from_status: 'inspection_pending', to_status: 'inspected', notes: 'Fully segregated into child batches' }, user?.id, t);
    }
  });
  return getById(tenantId, id);
};

const summary = async (tenantId) => {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const byStatus = await db.WarehouseBatch.findAll({
    where: { tenant_id: tenantId, parent_batch_id: null }, attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']], group: ['status'], raw: true,
  });
  const [receivedToday, pendingInspection] = await Promise.all([
    db.WarehouseBatch.count({ where: { tenant_id: tenantId, parent_batch_id: null, received_at: { [Op.gte]: dayStart } } }),
    db.WarehouseBatch.count({ where: { tenant_id: tenantId, status: 'inspection_pending' } }),
  ]);
  const blockedRows = await db.sequelize.query(
    'SELECT COUNT(DISTINCT bt.batch_id) AS n FROM warehouse_batch_tags bt JOIN warehouse_tags t ON t.id = bt.tag_id JOIN warehouse_batches b ON b.id = bt.batch_id WHERE t.blocks_processing = 1 AND b.tenant_id = ?',
    { replacements: [tenantId], type: db.sequelize.QueryTypes.SELECT }
  );
  const byLocation = await db.WarehouseBatch.findAll({
    where: { tenant_id: tenantId, status: { [Op.notIn]: FINAL } }, attributes: ['location', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']], group: ['location'], raw: true,
  });
  return {
    receivedToday,
    pendingInspection,
    blocked: Number(blockedRows[0]?.n || 0),
    byStatus: byStatus.map((r) => ({ status: r.status, label: STATUSES[r.status] || r.status, count: Number(r.n) })),
    byLocation: byLocation.map((r) => ({ location: r.location || 'No location', count: Number(r.n) })),
  };
};

module.exports = {
  STATUSES, CATEGORIES, ACTIONS, TAG_GROUPS,
  listTags, createTag, createForGrn, backfillFromGrns, list, getById, scan, addTag, removeTag, performAction, split, summary,
};
