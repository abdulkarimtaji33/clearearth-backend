/**
 * Payment transaction history (individual installments)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

// 'receivable_advance' represents an unapplied/advance customer receipt — a receipt recorded
// against a customer (source_id = companyId) that is not yet tied to a specific tax invoice.
const SOURCE_TYPES = ['receivable', 'payable', 'expense', 'receivable_advance'];
const RECEIPT_NUMBERED_TYPES = ['receivable', 'receivable_advance'];

async function nextReceiptNumber(tenantId, transaction) {
  const count = await db.PaymentTransaction.count({
    where: { tenant_id: tenantId, source_type: { [db.Sequelize.Op.in]: RECEIPT_NUMBERED_TYPES } },
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
    unappliedAmount,
  } = data;

  if (!SOURCE_TYPES.includes(sourceType)) {
    throw ApiError.badRequest(`Invalid sourceType: ${sourceType}`);
  }

  const receiptNumber = RECEIPT_NUMBERED_TYPES.includes(sourceType) ? await nextReceiptNumber(tenantId, transaction) : null;

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
      unapplied_amount: unappliedAmount != null ? unappliedAmount : 0,
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
      { model: db.JournalEntry, as: 'journalEntry', attributes: ['id', 'entry_number'], required: false },
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
