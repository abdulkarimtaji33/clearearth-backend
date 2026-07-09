/**
 * Payment transaction history (individual installments)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

const SOURCE_TYPES = ['receivable', 'payable', 'expense'];

async function nextReceiptNumber(tenantId, transaction) {
  const count = await db.PaymentTransaction.count({
    where: { tenant_id: tenantId, source_type: 'receivable' },
    transaction,
  });
  return String(1000 + count + 1).padStart(7, '0');
}

const createPaymentTransaction = async (tenantId, userId, data, transaction) => {
  const {
    sourceType,
    sourceId,
    amount,
    paymentMethod,
    paymentAccountId,
    referenceNo,
    paidTo,
    receivedFrom,
    notes,
    paidAt,
  } = data;

  if (!SOURCE_TYPES.includes(sourceType)) {
    throw ApiError.badRequest(`Invalid sourceType: ${sourceType}`);
  }

  const receiptNumber = sourceType === 'receivable' ? await nextReceiptNumber(tenantId, transaction) : null;

  return db.PaymentTransaction.create(
    {
      tenant_id: tenantId,
      source_type: sourceType,
      source_id: sourceId,
      amount,
      payment_method: paymentMethod || null,
      payment_account_id: paymentAccountId || null,
      reference_no: referenceNo || null,
      receipt_number: receiptNumber,
      paid_to: paidTo || null,
      received_from: receivedFrom || null,
      notes: notes || null,
      paid_at: paidAt || new Date().toISOString().slice(0, 10),
      created_by: userId || null,
    },
    { transaction }
  );
};

const listPaymentTransactions = async (tenantId, sourceType, sourceId) => {
  if (!SOURCE_TYPES.includes(sourceType)) {
    throw ApiError.badRequest(`Invalid sourceType: ${sourceType}`);
  }

  const rows = await db.PaymentTransaction.findAll({
    where: {
      tenant_id: tenantId,
      source_type: sourceType,
      source_id: sourceId,
    },
    include: [
      { model: db.ChartOfAccounts, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    ],
    order: [['paid_at', 'ASC'], ['id', 'ASC']],
  });

  return rows.map((r) => r.get({ plain: true }));
};

module.exports = {
  createPaymentTransaction,
  listPaymentTransactions,
  SOURCE_TYPES,
};
