/**
 * Resolve which GL asset account receives or sends cash for a payment.
 */
const db = require('../models');
const ApiError = require('./apiError');
const jeService = require('../services/journalEntry.service');

/** Default chart-of-accounts code per payment method */
const PAYMENT_METHOD_DEFAULT_ACCOUNT_CODE = {
  Cash: '1000',
  'Bank transfer': '1000',
  Cheque: '1000',
  'Credit card': '1000',
  'Online / portal': '1000',
  Other: '1000',
};

function defaultAccountCodeForMethod(paymentMethod) {
  const key = paymentMethod != null ? String(paymentMethod).trim() : '';
  return PAYMENT_METHOD_DEFAULT_ACCOUNT_CODE[key] || '1000';
}

/**
 * Resolve payment account id — explicit picker wins, else method default (Cash 1000).
 * @returns {Promise<{ accountId: number, accountCode: string, accountName: string, isDefault: boolean }>}
 */
async function resolvePaymentAccount(tenantId, { paymentMethod, paymentAccountId } = {}) {
  if (paymentAccountId != null && paymentAccountId !== '') {
    const acc = await db.ChartOfAccounts.findOne({
      where: {
        id: paymentAccountId,
        tenant_id: tenantId,
        is_group: false,
        is_active: true,
        type: 'asset',
      },
    });
    if (!acc) throw ApiError.badRequest('Invalid payment account — choose an active asset account');
    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      isDefault: false,
    };
  }

  const code = defaultAccountCodeForMethod(paymentMethod);
  const accountId = await jeService.getSystemAccountId(tenantId, code);
  const acc = await db.ChartOfAccounts.findOne({
    where: { id: accountId, tenant_id: tenantId },
    attributes: ['id', 'code', 'name'],
  });
  return {
    accountId,
    accountCode: acc?.code || code,
    accountName: acc?.name || 'Cash and Cash Equivalents',
    isDefault: true,
  };
}

/**
 * Resolve the GL expense account to debit for a manual expense — explicit picker wins,
 * else the category default (via chartOfAccounts.service.EXPENSE_CATEGORY_TO_CODE).
 * @returns {Promise<{ accountId: number, accountCode: string, accountName: string, isDefault: boolean }>}
 */
async function resolveExpenseAccount(tenantId, { category, expenseAccountId } = {}) {
  if (expenseAccountId != null && expenseAccountId !== '') {
    const acc = await db.ChartOfAccounts.findOne({
      where: {
        id: expenseAccountId,
        tenant_id: tenantId,
        is_group: false,
        is_active: true,
        type: 'expense',
      },
    });
    if (!acc) throw ApiError.badRequest('Invalid expense account — choose an active expense account');
    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      isDefault: false,
    };
  }

  const { EXPENSE_CATEGORY_TO_CODE } = require('../services/chartOfAccounts.service');
  const code = EXPENSE_CATEGORY_TO_CODE[category] || '5100';
  const accountId = await jeService.getSystemAccountId(tenantId, code);
  const acc = await db.ChartOfAccounts.findOne({
    where: { id: accountId, tenant_id: tenantId },
    attributes: ['id', 'code', 'name'],
  });
  return {
    accountId,
    accountCode: acc?.code || code,
    accountName: acc?.name || 'General & Administrative Expenses',
    isDefault: true,
  };
}

module.exports = {
  PAYMENT_METHOD_DEFAULT_ACCOUNT_CODE,
  defaultAccountCodeForMethod,
  resolvePaymentAccount,
  resolveExpenseAccount,
};
