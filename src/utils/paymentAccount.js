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

const CASH_BANK_SUB_TYPES = ['cash', 'bank'];

/** Cash/bank = the default 1000 account, sub_type cash/bank, or nested under such an account. */
async function isCashOrBank(tenantId, account) {
  let cur = account;
  for (let depth = 0; cur && depth < 20; depth += 1) {
    if (CASH_BANK_SUB_TYPES.includes(cur.sub_type) || String(cur.code) === '1000') return true;
    cur = cur.parent_id
      ? await db.ChartOfAccounts.findOne({ where: { id: cur.parent_id, tenant_id: tenantId } })
      : null;
  }
  return false;
}

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
    if (!acc || !(await isCashOrBank(tenantId, acc))) {
      throw ApiError.badRequest('Invalid payment account — choose an active cash or bank account');
    }
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
/**
 * Refuse a payment that would take a cash/bank account below zero unless the caller confirmed it
 * (`confirmNegative`). The screens warn first and send the flag when the user ticks "Pay anyway".
 */
async function assertNotOverdrawn(tenantId, accountId, amount, confirmNegative = false) {
  if (confirmNegative === true || confirmNegative === 'true') return;
  const [rows] = await db.sequelize.query(
    `SELECT COALESCE(SUM(l.debit - l.credit), 0) AS bal
       FROM journal_entry_lines l JOIN journal_entries e ON e.id = l.journal_entry_id AND e.status = 'posted'
      WHERE l.account_id = ? AND e.tenant_id = ?`,
    { replacements: [accountId, tenantId] }
  );
  const bal = parseFloat(rows[0] && rows[0].bal) || 0;
  const after = Math.round((bal - (parseFloat(amount) || 0)) * 100) / 100;
  if (after < -0.004) {
    const acc = await db.ChartOfAccounts.findOne({ where: { id: accountId, tenant_id: tenantId }, attributes: ['code', 'name'] });
    throw ApiError.badRequest(
      `This payment takes ${acc ? `${acc.code} ${acc.name}` : 'the account'} below zero (balance AED ${bal.toFixed(2)}, it would become ${after.toFixed(2)}). Confirm it to continue.`
    );
  }
}

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

  // The category's own default account wins; only fall back to the code map if it has none.
  const categoryRow = category
    ? await db.ExpenseCategory.findOne({ where: { tenant_id: tenantId, value: category }, attributes: ['default_account_id'] })
    : null;
  if (categoryRow?.default_account_id) {
    const acc = await db.ChartOfAccounts.findOne({
      where: { id: categoryRow.default_account_id, tenant_id: tenantId, is_group: false, is_active: true },
      attributes: ['id', 'code', 'name'],
    });
    if (acc) return { accountId: acc.id, accountCode: acc.code, accountName: acc.name, isDefault: true };
  }

  const { EXPENSE_CATEGORY_TO_CODE } = require('../services/chartOfAccounts.service');
  // 5100 is now a non-postable group account — fall back to its Miscellaneous G&A child.
  const code = EXPENSE_CATEGORY_TO_CODE[category] || '5140';
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
  assertNotOverdrawn,
  isCashOrBank,
};
