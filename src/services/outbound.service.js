const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { OUTBOUND_STATUS, LOT_STATUS } = require('../constants');

const getAllOutbound = async (tenantId, filters) => {
  const { offset, limit, status, lotId, clientId } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (lotId) where.lot_id = lotId;
  if (clientId) where.client_id = clientId;

  const { count, rows } = await db.Outbound.findAndCountAll({
    where,
    include: [
      { model: db.Lot, as: 'lot' },
      { model: db.Client, as: 'client' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.Invoice, as: 'invoice' },
    ],
    offset,
    limit,
    order: [['dispatch_date', 'DESC']],
  });

  return { outbounds: rows, total: count };
};

const getOutboundById = async (tenantId, outboundId) => {
  const outbound = await db.Outbound.findOne({
    where: { id: outboundId, tenant_id: tenantId },
    include: [
      { model: db.Lot, as: 'lot' },
      { model: db.Client, as: 'client' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.Invoice, as: 'invoice' },
      { model: db.MaterialType, as: 'materialType' },
    ],
  });

  if (!outbound) throw ApiError.notFound('Outbound record not found');
  return outbound;
};

const createOutbound = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const outboundNumber = generateReferenceNumber('OUT');

    // Verify lot exists and has sufficient quantity
    const lot = await db.Lot.findOne({
      where: { id: data.lotId, tenant_id: tenantId },
      transaction,
    });

    if (!lot) throw ApiError.notFound('Lot not found');

    if (parseFloat(lot.current_quantity) < parseFloat(data.quantity)) {
      throw ApiError.badRequest('Insufficient quantity in lot');
    }

    const outbound = await db.Outbound.create(
      {
        tenant_id: tenantId,
        outbound_number: outboundNumber,
        lot_id: data.lotId,
        client_id: data.clientId,
        warehouse_id: data.warehouseId,
        material_type_id: lot.material_type_id,
        invoice_id: data.invoiceId,
        dispatch_date: data.dispatchDate || new Date(),
        quantity: data.quantity,
        unit_of_measure: lot.unit_of_measure,
        vehicle_number: data.vehicleNumber,
        driver_name: data.driverName,
        destination: data.destination,
        photos: data.photos || [],
        dispatched_by: userId,
        status: OUTBOUND_STATUS.PENDING,
        notes: data.notes,
      },
      { transaction }
    );

    await transaction.commit();
    return await getOutboundById(tenantId, outbound.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const confirmDispatch = async (tenantId, outboundId, userId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const outbound = await db.Outbound.findOne({
      where: { id: outboundId, tenant_id: tenantId },
      transaction,
    });

    if (!outbound) throw ApiError.notFound('Outbound record not found');

    if (outbound.status !== OUTBOUND_STATUS.PENDING) {
      throw ApiError.badRequest('Only pending outbound can be confirmed');
    }

    const lot = await db.Lot.findOne({
      where: { id: outbound.lot_id, tenant_id: tenantId },
      transaction,
    });

    if (!lot) throw ApiError.notFound('Lot not found');

    // Update lot quantity
    const newQuantity = parseFloat(lot.current_quantity) - parseFloat(outbound.quantity);
    await lot.update({ current_quantity: newQuantity }, { transaction });

    // If lot is empty, close it
    if (newQuantity === 0) {
      await lot.update(
        {
          status: LOT_STATUS.SOLD,
          closed_at: new Date(),
        },
        { transaction }
      );
    }

    // Create stock movement
    await db.StockMovement.create(
      {
        tenant_id: tenantId,
        lot_id: outbound.lot_id,
        warehouse_id: outbound.warehouse_id,
        material_type_id: outbound.material_type_id,
        transaction_type: 'outbound',
        transaction_date: outbound.dispatch_date,
        reference_number: outbound.outbound_number,
        reference_type: 'OUTBOUND',
        reference_id: outbound.id,
        quantity: -parseFloat(outbound.quantity),
        unit_of_measure: outbound.unit_of_measure,
        created_by: userId,
      },
      { transaction }
    );

    // Update inventory
    const inventory = await db.Inventory.findOne({
      where: {
        tenant_id: tenantId,
        warehouse_id: outbound.warehouse_id,
        material_type_id: outbound.material_type_id,
      },
      transaction,
    });

    if (inventory) {
      await inventory.update(
        {
          total_quantity: parseFloat(inventory.total_quantity) - parseFloat(outbound.quantity),
          last_updated: new Date(),
        },
        { transaction }
      );
    }

    // Update outbound status
    await outbound.update(
      {
        status: OUTBOUND_STATUS.DISPATCHED,
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return await getOutboundById(tenantId, outboundId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const completeDelivery = async (tenantId, outboundId, userId, deliveryData) => {
  const outbound = await db.Outbound.findOne({
    where: { id: outboundId, tenant_id: tenantId },
  });

  if (!outbound) throw ApiError.notFound('Outbound record not found');

  await outbound.update({
    status: OUTBOUND_STATUS.DELIVERED,
    delivery_date: deliveryData.deliveryDate || new Date(),
    received_by_name: deliveryData.receivedByName,
    delivery_notes: deliveryData.deliveryNotes,
  });

  return await getOutboundById(tenantId, outboundId);
};

module.exports = {
  getAllOutbound,
  getOutboundById,
  createOutbound,
  confirmDispatch,
  completeDelivery,
};
