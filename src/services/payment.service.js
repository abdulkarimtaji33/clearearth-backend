const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { PAYMENT_STATUS, CHEQUE_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, paymentType, paymentMethod, clientId, vendorId, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (paymentType) where.payment_type = paymentType;
  if (paymentMethod) where.payment_method = paymentMethod;
  if (clientId) where.client_id = clientId;
  if (vendorId) where.vendor_id = vendorId;
  if (startDate && endDate) {
    where.payment_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.Payment.findAndCountAll({
    where,
    include: [
      { model: db.Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total_amount'] },
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
      { model: db.Vendor, as: 'vendor', attributes: ['id', 'company_name'] },
      { model: db.Cheque, as: 'cheque' },
    ],
    offset,
    limit,
    order: [['payment_date', 'DESC']],
  });

  return { payments: rows, total: count };
};

const getById = async (tenantId, paymentId) => {
  const payment = await db.Payment.findOne({
    where: { id: paymentId, tenant_id: tenantId },
    include: [
      { model: db.Invoice, as: 'invoice' },
      { model: db.Client, as: 'client' },
      { model: db.Vendor, as: 'vendor' },
      { model: db.Cheque, as: 'cheque' },
    ],
  });

  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
};

const create = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const paymentNumber = generateReferenceNumber('PAY');

    const payment = await db.Payment.create(
      {
        tenant_id: tenantId,
        payment_number: paymentNumber,
        payment_date: data.paymentDate || new Date(),
        payment_type: data.paymentType,
        payment_method: data.paymentMethod,
        invoice_id: data.invoiceId,
        client_id: data.clientId,
        vendor_id: data.vendorId,
        amount: data.amount,
        currency: data.currency || 'AED',
        reference_number: data.referenceNumber,
        bank_account: data.bankAccount,
        notes: data.notes,
        status: PAYMENT_STATUS.COMPLETED,
        received_by: userId,
      },
      { transaction }
    );

    // Handle cheque payments
    if (data.paymentMethod === 'cheque') {
      await db.Cheque.create(
        {
          tenant_id: tenantId,
          payment_id: payment.id,
          cheque_number: data.chequeNumber,
          bank_name: data.bankName,
          cheque_date: data.chequeDate,
          maturity_date: data.maturityDate || data.chequeDate,
          amount: data.amount,
          status: CHEQUE_STATUS.ISSUED,
          notes: data.chequeNotes,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await getById(tenantId, payment.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateChequeStatus = async (tenantId, chequeId, status, data) => {
  const cheque = await db.Cheque.findOne({
    where: { id: chequeId, tenant_id: tenantId },
  });

  if (!cheque) throw ApiError.notFound('Cheque not found');

  const updateData = { status };

  if (status === CHEQUE_STATUS.DEPOSITED) {
    updateData.deposited_date = data.depositedDate || new Date();
  } else if (status === CHEQUE_STATUS.CLEARED) {
    updateData.cleared_date = data.clearedDate || new Date();
  } else if (status === CHEQUE_STATUS.BOUNCED) {
    updateData.bounce_reason = data.bounceReason;
  }

  await cheque.update(updateData);
  return cheque;
};

const getPostDatedCheques = async tenantId => {
  const cheques = await db.Cheque.findAll({
    where: {
      tenant_id: tenantId,
      status: { [Op.in]: [CHEQUE_STATUS.ISSUED, CHEQUE_STATUS.DEPOSITED] },
      maturity_date: { [Op.gte]: new Date() },
    },
    include: [
      {
        model: db.Payment,
        as: 'payment',
        include: [
          { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
          { model: db.Vendor, as: 'vendor', attributes: ['id', 'company_name'] },
        ],
      },
    ],
    order: [['maturity_date', 'ASC']],
  });

  return cheques;
};

const remove = async (tenantId, paymentId) => {
  const payment = await db.Payment.findOne({
    where: { id: paymentId, tenant_id: tenantId },
  });

  if (!payment) throw ApiError.notFound('Payment not found');

  if (payment.status === PAYMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot delete completed payment');
  }

  await payment.destroy();
};

module.exports = {
  getAll,
  getById,
  create,
  updateChequeStatus,
  getPostDatedCheques,
  remove,
};
