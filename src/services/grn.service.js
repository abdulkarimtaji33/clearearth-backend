/**
 * Goods Received Note (GRN) service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const DEFAULT_WAREHOUSE_ID = 1;
const GRN_STATUSES = ['draft', 'submitted', 'approved'];

const grnIncludes = [
  { model: db.WorkOrder, as: 'workOrder', attributes: ['id', 'title', 'status'], required: false },
  {
    model: db.Deal,
    as: 'deal',
    attributes: ['id', 'deal_number', 'title', 'status', 'assigned_to', 'lead_id'],
    required: false,
    include: [
      {
        model: db.Lead,
        as: 'lead',
        attributes: ['id', 'company_name', 'contact_name', 'email', 'phone'],
        required: false,
      },
      {
        model: db.User,
        as: 'assignedUser',
        attributes: ['id', 'first_name', 'last_name', 'email'],
        required: false,
      },
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoices',
        attributes: ['id', 'proforma_number'],
        required: false,
        include: [
          {
            model: db.TaxInvoice,
            as: 'taxInvoice',
            attributes: ['id', 'tax_invoice_number', 'payment_status', 'total'],
            required: false,
          },
        ],
      },
    ],
  },
  { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
  { model: db.User, as: 'approvedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
  {
    model: db.GrnItem,
    as: 'items',
    include: [{ model: db.MaterialType, as: 'materialType', required: false }],
  },
  { model: db.GrnImage, as: 'images' },
];

async function nextGrnNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const prefix = `GRN-${year}-`;
  const [rows] = await db.sequelize.query(
    `SELECT grn_number FROM grns WHERE tenant_id = ? AND grn_number LIKE ? ORDER BY grn_number DESC LIMIT 1`,
    { replacements: [tenantId, `${prefix}%`], transaction }
  );
  let seq = 1;
  if (rows?.[0]?.grn_number) {
    const parts = String(rows[0].grn_number).split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(last)) seq = last + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function incrementInventory(tenantId, materialTypeId, quantity, unitOfMeasure, transaction) {
  if (!materialTypeId || !quantity || parseFloat(quantity) <= 0) return;

  const qty = parseFloat(quantity);
  const uom = unitOfMeasure || 'kg';

  const existing = await db.Inventory.findOne({
    where: {
      tenant_id: tenantId,
      warehouse_id: DEFAULT_WAREHOUSE_ID,
      material_type_id: materialTypeId,
    },
    transaction,
  });

  if (existing) {
    await existing.update(
      {
        total_quantity: parseFloat(existing.total_quantity || 0) + qty,
        unit_of_measure: uom,
        last_updated: new Date(),
      },
      { transaction }
    );
  } else {
    await db.Inventory.create(
      {
        tenant_id: tenantId,
        warehouse_id: DEFAULT_WAREHOUSE_ID,
        material_type_id: materialTypeId,
        total_quantity: qty,
        unit_of_measure: uom,
        total_value: 0,
        last_updated: new Date(),
      },
      { transaction }
    );
  }
}

const listGrns = async (tenantId, filters = {}) => {
  const { offset, limit, search, status, workOrderId } = filters;
  const where = { tenant_id: tenantId };
  if (status && GRN_STATUSES.includes(status)) where.status = status;
  if (workOrderId) where.work_order_id = workOrderId;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [{ grn_number: { [Op.like]: s } }, { notes: { [Op.like]: s } }];
  }

  const { count, rows } = await db.Grn.findAndCountAll({
    where,
    include: grnIncludes,
    offset,
    limit,
    order: [['id', 'DESC']],
    distinct: true,
  });

  return { grns: rows.map((r) => r.get({ plain: true })), total: count };
};

const getById = async (tenantId, id) => {
  const row = await db.Grn.findOne({
    where: { id, tenant_id: tenantId },
    include: grnIncludes,
  });
  if (!row) throw ApiError.notFound('GRN not found');
  return row.get({ plain: true });
};

const createGrn = async (tenantId, userId, body) => {
  const { workOrderId, dealId, notes, items = [], images = [] } = body;

  let resolvedDealId = dealId || null;
  if (workOrderId) {
    const wo = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
    if (!wo) throw ApiError.notFound('Work order not found');
    if (wo.status !== 'completed') throw ApiError.badRequest('GRN can only be created for completed work orders');
    resolvedDealId = resolvedDealId || wo.deal_id;
  }

  const t = await db.sequelize.transaction();
  try {
    const grnNumber = await nextGrnNumber(tenantId, t);
    const grn = await db.Grn.create(
      {
        tenant_id: tenantId,
        grn_number: grnNumber,
        work_order_id: workOrderId || null,
        deal_id: resolvedDealId,
        status: 'draft',
        notes: notes || null,
        created_by: userId,
      },
      { transaction: t }
    );

    if (Array.isArray(items) && items.length) {
      await db.GrnItem.bulkCreate(
        items.map((it) => ({
          grn_id: grn.id,
          item_name: it.itemName || it.item_name || 'Item',
          material_type_id: it.materialTypeId || it.material_type_id || null,
          quantity: parseFloat(it.quantity) || 0,
          unit_of_measure: it.unitOfMeasure || it.unit_of_measure || 'kg',
          notes: it.notes || null,
        })),
        { transaction: t }
      );
    }

    if (Array.isArray(images) && images.length) {
      await db.GrnImage.bulkCreate(
        images.map((img) => ({
          grn_id: grn.id,
          image_url: img.imageUrl || img.image_url,
          original_name: img.originalName || img.original_name || null,
        })),
        { transaction: t }
      );
    }

    await t.commit();
    return getById(tenantId, grn.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const updateGrn = async (tenantId, id, body) => {
  const grn = await db.Grn.findOne({ where: { id, tenant_id: tenantId } });
  if (!grn) throw ApiError.notFound('GRN not found');
  if (grn.status === 'approved') throw ApiError.badRequest('Approved GRN cannot be edited');

  const t = await db.sequelize.transaction();
  try {
    await grn.update(
      {
        notes: body.notes !== undefined ? body.notes : grn.notes,
        status: body.status && GRN_STATUSES.includes(body.status) ? body.status : grn.status,
      },
      { transaction: t }
    );

    if (Array.isArray(body.items)) {
      await db.GrnItem.destroy({ where: { grn_id: id }, transaction: t });
      if (body.items.length) {
        await db.GrnItem.bulkCreate(
          body.items.map((it) => ({
            grn_id: id,
            item_name: it.itemName || it.item_name || 'Item',
            material_type_id: it.materialTypeId || it.material_type_id || null,
            quantity: parseFloat(it.quantity) || 0,
            unit_of_measure: it.unitOfMeasure || it.unit_of_measure || 'kg',
            notes: it.notes || null,
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();
    return getById(tenantId, id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const addImages = async (tenantId, id, images) => {
  const grn = await db.Grn.findOne({ where: { id, tenant_id: tenantId } });
  if (!grn) throw ApiError.notFound('GRN not found');
  if (grn.status === 'approved') throw ApiError.badRequest('Cannot add images to approved GRN');

  if (!Array.isArray(images) || !images.length) throw ApiError.badRequest('No images provided');

  await db.GrnImage.bulkCreate(
    images.map((img) => ({
      grn_id: id,
      image_url: img.imageUrl || img.image_url,
      original_name: img.originalName || img.original_name || null,
    }))
  );

  return getById(tenantId, id);
};

const approveGrn = async (tenantId, id, userId) => {
  const grn = await db.Grn.findOne({
    where: { id, tenant_id: tenantId },
    include: [{ model: db.GrnItem, as: 'items' }],
  });
  if (!grn) throw ApiError.notFound('GRN not found');
  if (grn.status === 'approved') throw ApiError.badRequest('GRN already approved');
  if (!grn.items?.length) throw ApiError.badRequest('GRN must have at least one item');

  const t = await db.sequelize.transaction();
  try {
    for (const item of grn.items) {
      if (item.material_type_id) {
        await incrementInventory(
          tenantId,
          item.material_type_id,
          item.quantity,
          item.unit_of_measure,
          t
        );
      }
    }

    await grn.update(
      {
        status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    return getById(tenantId, id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

module.exports = {
  listGrns,
  getById,
  createGrn,
  updateGrn,
  addImages,
  approveGrn,
};
