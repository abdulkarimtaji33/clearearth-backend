const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateLotNumber, generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { LOT_STATUS, INVENTORY_TRANSACTION_TYPE } = require('../constants');

const getAllInventory = async (tenantId, filters) => {
  const { offset, limit, warehouseId, materialTypeId } = filters;
  const where = { tenant_id: tenantId };

  if (warehouseId) where.warehouse_id = warehouseId;
  if (materialTypeId) where.material_type_id = materialTypeId;

  const { count, rows } = await db.Inventory.findAndCountAll({
    where,
    include: [
      { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
      { model: db.MaterialType, as: 'materialType', attributes: ['id', 'name', 'category'] },
    ],
    offset,
    limit,
    order: [['last_updated', 'DESC']],
  });

  return { inventory: rows, total: count };
};

const getAllLots = async (tenantId, filters) => {
  const { offset, limit, status, warehouseId, jobId } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (warehouseId) where.warehouse_id = warehouseId;
  if (jobId) where.job_id = jobId;

  const { count, rows } = await db.Lot.findAndCountAll({
    where,
    include: [
      { model: db.Job, as: 'job' },
      { model: db.Deal, as: 'deal' },
      { model: db.MaterialType, as: 'materialType' },
      { model: db.Warehouse, as: 'warehouse' },
    ],
    offset,
    limit,
    order: [['opened_at', 'DESC']],
  });

  return { lots: rows, total: count };
};

const getLotById = async (tenantId, lotId) => {
  const lot = await db.Lot.findOne({
    where: { id: lotId, tenant_id: tenantId },
    include: [
      { model: db.Job, as: 'job' },
      { model: db.Deal, as: 'deal' },
      { model: db.MaterialType, as: 'materialType' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.StockMovement, as: 'movements', order: [['transaction_date', 'DESC']] },
    ],
  });

  if (!lot) throw ApiError.notFound('Lot not found');
  return lot;
};

const createLot = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const lotNumber = generateLotNumber('LOT', await db.Lot.count({ where: { tenant_id: tenantId } }) + 1);

    const lot = await db.Lot.create(
      {
        tenant_id: tenantId,
        lot_number: lotNumber,
        job_id: data.jobId,
        deal_id: data.dealId,
        material_type_id: data.materialTypeId,
        warehouse_id: data.warehouseId,
        initial_quantity: data.quantity,
        current_quantity: data.quantity,
        unit_of_measure: data.unitOfMeasure || 'kg',
        cost_per_unit: data.costPerUnit || 0,
        total_cost: (data.quantity * (data.costPerUnit || 0)),
        value_of_material: data.valueOfMaterial || null,
        status: LOT_STATUS.OPEN,
        opened_at: new Date(),
        notes: data.notes,
      },
      { transaction }
    );

    // Create stock movement
    await db.StockMovement.create(
      {
        tenant_id: tenantId,
        lot_id: lot.id,
        warehouse_id: data.warehouseId,
        material_type_id: data.materialTypeId,
        transaction_type: INVENTORY_TRANSACTION_TYPE.INBOUND,
        transaction_date: new Date(),
        reference_number: data.referenceNumber,
        reference_type: data.referenceType || 'GRN',
        reference_id: data.referenceId,
        quantity: data.quantity,
        unit_of_measure: data.unitOfMeasure || 'kg',
        cost_per_unit: data.costPerUnit || 0,
        total_cost: (data.quantity * (data.costPerUnit || 0)),
        notes: data.notes,
        created_by: userId,
      },
      { transaction }
    );

    // Update inventory summary
    await updateInventorySummary(tenantId, data.warehouseId, data.materialTypeId, transaction);

    await transaction.commit();
    return await getLotById(tenantId, lot.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateLot = async (tenantId, lotId, data) => {
  const lot = await db.Lot.findOne({ where: { id: lotId, tenant_id: tenantId } });
  if (!lot) throw ApiError.notFound('Lot not found');

  if (lot.status === LOT_STATUS.CLOSED || lot.status === LOT_STATUS.SOLD) {
    throw ApiError.badRequest('Cannot update closed or sold lot');
  }

  await lot.update({
    value_of_material: data.valueOfMaterial ?? lot.value_of_material,
    notes: data.notes || lot.notes,
  });

  return await getLotById(tenantId, lotId);
};

const adjustLotQuantity = async (tenantId, lotId, userId, adjustment) => {
  const transaction = await db.sequelize.transaction();

  try {
    const lot = await db.Lot.findOne({ where: { id: lotId, tenant_id: tenantId }, transaction });
    if (!lot) throw ApiError.notFound('Lot not found');

    if (lot.status === LOT_STATUS.CLOSED || lot.status === LOT_STATUS.SOLD) {
      throw ApiError.badRequest('Cannot adjust closed or sold lot');
    }

    const newQuantity = parseFloat(lot.current_quantity) + parseFloat(adjustment.quantity);
    if (newQuantity < 0) {
      throw ApiError.badRequest('Adjustment would result in negative quantity');
    }

    await lot.update({ current_quantity: newQuantity }, { transaction });

    // Create stock movement
    await db.StockMovement.create(
      {
        tenant_id: tenantId,
        lot_id: lot.id,
        warehouse_id: lot.warehouse_id,
        material_type_id: lot.material_type_id,
        transaction_type: INVENTORY_TRANSACTION_TYPE.ADJUSTMENT,
        transaction_date: new Date(),
        reference_number: generateReferenceNumber('ADJ'),
        quantity: adjustment.quantity,
        unit_of_measure: lot.unit_of_measure,
        notes: adjustment.reason,
        created_by: userId,
      },
      { transaction }
    );

    // Update inventory summary
    await updateInventorySummary(tenantId, lot.warehouse_id, lot.material_type_id, transaction);

    await transaction.commit();
    return await getLotById(tenantId, lotId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const closeLot = async (tenantId, lotId, userId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const lot = await db.Lot.findOne({ where: { id: lotId, tenant_id: tenantId }, transaction });
    if (!lot) throw ApiError.notFound('Lot not found');

    if (lot.status === LOT_STATUS.CLOSED || lot.status === LOT_STATUS.SOLD) {
      throw ApiError.badRequest('Lot already closed');
    }

    await lot.update(
      {
        status: LOT_STATUS.CLOSED,
        closed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return await getLotById(tenantId, lotId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getStockMovements = async (tenantId, filters) => {
  const { offset, limit, lotId, warehouseId, transactionType, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (lotId) where.lot_id = lotId;
  if (warehouseId) where.warehouse_id = warehouseId;
  if (transactionType) where.transaction_type = transactionType;
  if (startDate && endDate) {
    where.transaction_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.StockMovement.findAndCountAll({
    where,
    include: [
      { model: db.Lot, as: 'lot' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.MaterialType, as: 'materialType' },
      { model: db.User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['transaction_date', 'DESC']],
  });

  return { movements: rows, total: count };
};

const updateInventorySummary = async (tenantId, warehouseId, materialTypeId, transaction) => {
  // Calculate total quantity for this warehouse and material type from all open lots
  const totalQuantity = await db.Lot.sum('current_quantity', {
    where: {
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      material_type_id: materialTypeId,
      status: { [Op.in]: [LOT_STATUS.OPEN, LOT_STATUS.WORK_IN_PROGRESS] },
    },
    transaction,
  });

  const totalValue = await db.Lot.sum('total_cost', {
    where: {
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      material_type_id: materialTypeId,
      status: { [Op.in]: [LOT_STATUS.OPEN, LOT_STATUS.WORK_IN_PROGRESS] },
    },
    transaction,
  });

  // Update or create inventory summary
  const [inventory] = await db.Inventory.findOrCreate({
    where: {
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      material_type_id: materialTypeId,
    },
    defaults: {
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      material_type_id: materialTypeId,
      total_quantity: totalQuantity || 0,
      total_value: totalValue || 0,
      last_updated: new Date(),
    },
    transaction,
  });

  await inventory.update(
    {
      total_quantity: totalQuantity || 0,
      total_value: totalValue || 0,
      last_updated: new Date(),
    },
    { transaction }
  );
};

const getInventoryValuation = async (tenantId, filters) => {
  const { warehouseId } = filters;
  const where = {
    tenant_id: tenantId,
    status: { [Op.in]: [LOT_STATUS.OPEN, LOT_STATUS.WORK_IN_PROGRESS] },
  };

  if (warehouseId) where.warehouse_id = warehouseId;

  const lots = await db.Lot.findAll({
    where,
    include: [
      { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
      { model: db.MaterialType, as: 'materialType', attributes: ['id', 'name', 'category'] },
    ],
    attributes: [
      'id',
      'lot_number',
      'current_quantity',
      'unit_of_measure',
      'cost_per_unit',
      'total_cost',
      'value_of_material',
    ],
  });

  const totalValue = lots.reduce((sum, lot) => sum + parseFloat(lot.total_cost || 0), 0);

  return {
    lots,
    totalLots: lots.length,
    totalValue,
  };
};

module.exports = {
  getAllInventory,
  getAllLots,
  getLotById,
  createLot,
  updateLot,
  adjustLotQuantity,
  closeLot,
  getStockMovements,
  getInventoryValuation,
};
