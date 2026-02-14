const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { GRN_STATUS, DEAL_TYPE } = require('../constants');

const getAllGRNs = async (tenantId, filters) => {
  const { offset, limit, status, dealId, vendorId } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (dealId) where.deal_id = dealId;
  if (vendorId) where.vendor_id = vendorId;

  const { count, rows } = await db.GoodsReceiptNote.findAndCountAll({
    where,
    include: [
      { model: db.Deal, as: 'deal' },
      { model: db.Vendor, as: 'vendor' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.Job, as: 'job' },
    ],
    offset,
    limit,
    order: [['receipt_date', 'DESC']],
  });

  return { grns: rows, total: count };
};

const getGRNById = async (tenantId, grnId) => {
  const grn = await db.GoodsReceiptNote.findOne({
    where: { id: grnId, tenant_id: tenantId },
    include: [
      { model: db.Deal, as: 'deal' },
      { model: db.Vendor, as: 'vendor' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.Job, as: 'job' },
      { model: db.MaterialType, as: 'materialType' },
    ],
  });

  if (!grn) throw ApiError.notFound('GRN not found');
  return grn;
};

const createGRN = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const grnNumber = generateReferenceNumber('GRN');

    // Get deal to determine type
    const deal = await db.Deal.findOne({
      where: { id: data.dealId, tenant_id: tenantId },
      transaction,
    });

    if (!deal) throw ApiError.notFound('Deal not found');

    // Determine cost based on deal type
    let costPerUnit = 0;
    let totalCost = 0;

    if (deal.deal_type === DEAL_TYPE.OFFER_TO_PURCHASE) {
      costPerUnit = data.costPerUnit || 0;
      totalCost = parseFloat(data.quantity) * costPerUnit;
    }
    // For FoC and Service deals, cost is 0 until processed

    const grn = await db.GoodsReceiptNote.create(
      {
        tenant_id: tenantId,
        grn_number: grnNumber,
        deal_id: data.dealId,
        job_id: data.jobId,
        vendor_id: data.vendorId,
        warehouse_id: data.warehouseId,
        material_type_id: data.materialTypeId,
        receipt_date: data.receiptDate || new Date(),
        reference_number: data.referenceNumber,
        quantity: data.quantity,
        unit_of_measure: data.unitOfMeasure || 'kg',
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        vehicle_number: data.vehicleNumber,
        driver_name: data.driverName,
        condition_notes: data.conditionNotes,
        photos: data.photos || [],
        received_by: userId,
        status: GRN_STATUS.PENDING,
        notes: data.notes,
      },
      { transaction }
    );

    await transaction.commit();
    return await getGRNById(tenantId, grn.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const approveGRN = async (tenantId, grnId, userId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const grn = await db.GoodsReceiptNote.findOne({
      where: { id: grnId, tenant_id: tenantId },
      transaction,
    });

    if (!grn) throw ApiError.notFound('GRN not found');
    if (grn.status !== GRN_STATUS.PENDING) {
      throw ApiError.badRequest('Only pending GRNs can be approved');
    }

    await grn.update(
      {
        status: GRN_STATUS.APPROVED,
        approved_by: userId,
        approved_at: new Date(),
      },
      { transaction }
    );

    // Create lot from GRN
    const lotNumber = generateReferenceNumber('LOT');
    const lot = await db.Lot.create(
      {
        tenant_id: tenantId,
        lot_number: lotNumber,
        job_id: grn.job_id,
        deal_id: grn.deal_id,
        material_type_id: grn.material_type_id,
        warehouse_id: grn.warehouse_id,
        initial_quantity: grn.quantity,
        current_quantity: grn.quantity,
        unit_of_measure: grn.unit_of_measure,
        cost_per_unit: grn.cost_per_unit,
        total_cost: grn.total_cost,
        status: 'open',
        opened_at: new Date(),
        notes: `Created from GRN ${grn.grn_number}`,
      },
      { transaction }
    );

    // Create stock movement
    await db.StockMovement.create(
      {
        tenant_id: tenantId,
        lot_id: lot.id,
        warehouse_id: grn.warehouse_id,
        material_type_id: grn.material_type_id,
        transaction_type: 'inbound',
        transaction_date: grn.receipt_date,
        reference_number: grn.grn_number,
        reference_type: 'GRN',
        reference_id: grn.id,
        quantity: grn.quantity,
        unit_of_measure: grn.unit_of_measure,
        cost_per_unit: grn.cost_per_unit,
        total_cost: grn.total_cost,
        created_by: userId,
      },
      { transaction }
    );

    // Update inventory
    const [inventory] = await db.Inventory.findOrCreate({
      where: {
        tenant_id: tenantId,
        warehouse_id: grn.warehouse_id,
        material_type_id: grn.material_type_id,
      },
      defaults: {
        tenant_id: tenantId,
        warehouse_id: grn.warehouse_id,
        material_type_id: grn.material_type_id,
        total_quantity: 0,
        total_value: 0,
      },
      transaction,
    });

    await inventory.update(
      {
        total_quantity: parseFloat(inventory.total_quantity) + parseFloat(grn.quantity),
        total_value: parseFloat(inventory.total_value) + parseFloat(grn.total_cost),
        last_updated: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return await getGRNById(tenantId, grnId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const rejectGRN = async (tenantId, grnId, userId, reason) => {
  const grn = await db.GoodsReceiptNote.findOne({
    where: { id: grnId, tenant_id: tenantId },
  });

  if (!grn) throw ApiError.notFound('GRN not found');

  await grn.update({
    status: GRN_STATUS.REJECTED,
    rejection_reason: reason,
    rejected_by: userId,
    rejected_at: new Date(),
  });

  return await getGRNById(tenantId, grnId);
};

module.exports = {
  getAllGRNs,
  getGRNById,
  createGRN,
  approveGRN,
  rejectGRN,
};
