const db = require('../models');
const ApiError = require('../utils/apiError');
const { clearAccountCache } = require('./journalEntry.service');

// Standard UAE service business chart of accounts
const DEFAULT_ACCOUNTS = [
  // ASSETS
  { code: '1000', name: 'Cash and Cash Equivalents',    type: 'asset',     sub_type: 'current_asset',   normal_balance: 'debit',  sort_order: 10 },
  { code: '1100', name: 'Accounts Receivable',           type: 'asset',     sub_type: 'current_asset',   normal_balance: 'debit',  sort_order: 20 },
  { code: '1200', name: 'VAT Receivable (Input Tax)',    type: 'asset',     sub_type: 'current_asset',   normal_balance: 'debit',  sort_order: 30 },
  { code: '1300', name: 'Prepaid Expenses',              type: 'asset',     sub_type: 'current_asset',   normal_balance: 'debit',  sort_order: 40 },
  { code: '1510', name: 'Office Equipment — Cost',       type: 'asset',     sub_type: 'fixed_asset',     normal_balance: 'debit',  sort_order: 50 },
  { code: '1520', name: 'Accumulated Depreciation',      type: 'asset',     sub_type: 'fixed_asset',     normal_balance: 'credit', sort_order: 60 },
  // LIABILITIES
  { code: '2000', name: 'Accounts Payable',              type: 'liability', sub_type: 'current_liability', normal_balance: 'credit', sort_order: 110 },
  { code: '2100', name: 'VAT Payable (Output Tax)',      type: 'liability', sub_type: 'current_liability', normal_balance: 'credit', sort_order: 120 },
  { code: '2200', name: 'Accrued Expenses',              type: 'liability', sub_type: 'current_liability', normal_balance: 'credit', sort_order: 130 },
  { code: '2300', name: 'Unearned Revenue',              type: 'liability', sub_type: 'current_liability', normal_balance: 'credit', sort_order: 140 },
  { code: '2500', name: 'Loans Payable',                 type: 'liability', sub_type: 'long_term_liability', normal_balance: 'credit', sort_order: 150 },
  // EQUITY
  { code: '3000', name: "Owner's Capital / Share Capital", type: 'equity', sub_type: 'equity',           normal_balance: 'credit', sort_order: 210 },
  { code: '3100', name: 'Retained Earnings',             type: 'equity',    sub_type: 'equity',           normal_balance: 'credit', sort_order: 220 },
  { code: '3200', name: 'Drawings',                      type: 'equity',    sub_type: 'equity',           normal_balance: 'debit',  sort_order: 230 },
  // REVENUE
  { code: '4000', name: 'Service Revenue',               type: 'revenue',   sub_type: 'operating_revenue', normal_balance: 'credit', sort_order: 310 },
  { code: '4100', name: 'Other Income',                  type: 'revenue',   sub_type: 'other_income',     normal_balance: 'credit', sort_order: 320 },
  // EXPENSES
  { code: '5000', name: 'Cost of Services (Work Orders)', type: 'expense',  sub_type: 'cost_of_revenue',  normal_balance: 'debit',  sort_order: 410 },
  { code: '5100', name: 'General & Administrative Expenses', type: 'expense', sub_type: 'operating_expense', normal_balance: 'debit', sort_order: 420 },
  { code: '5200', name: 'Materials & Equipment',         type: 'expense',   sub_type: 'operating_expense', normal_balance: 'debit',  sort_order: 430 },
  { code: '5300', name: 'Professional Services',         type: 'expense',   sub_type: 'operating_expense', normal_balance: 'debit',  sort_order: 440 },
  { code: '5400', name: 'Fuel & Transport',              type: 'expense',   sub_type: 'operating_expense', normal_balance: 'debit',  sort_order: 450 },
  { code: '5500', name: 'Utilities',                     type: 'expense',   sub_type: 'operating_expense', normal_balance: 'debit',  sort_order: 460 },
  { code: '5600', name: 'Finance Charges',               type: 'expense',   sub_type: 'finance_cost',     normal_balance: 'debit',  sort_order: 470 },
];

/** Map expense categories to account codes */
const EXPENSE_CATEGORY_TO_CODE = {
  work_orders:  '5000',
  materials:    '5200',
  equipment:    '5200',
  professional: '5300',
  travel:       '5400',
  fuel:         '5400',
  utility:      '5500',
  other:        '5100',
};

async function seedDefaultAccounts(tenantId, userId) {
  const existing = await db.ChartOfAccounts.count({ where: { tenant_id: tenantId } });
  if (existing > 0) return { seeded: false, message: 'Accounts already exist for this tenant' };

  const now = new Date();
  const rows = DEFAULT_ACCOUNTS.map((a) => ({
    tenant_id: tenantId,
    code: a.code,
    name: a.name,
    type: a.type,
    sub_type: a.sub_type || null,
    normal_balance: a.normal_balance,
    is_group: false,
    is_system: true,
    is_active: true,
    sort_order: a.sort_order || 0,
    created_at: now,
    updated_at: now,
  }));

  await db.ChartOfAccounts.bulkCreate(rows);
  clearAccountCache(tenantId);
  return { seeded: true, count: rows.length };
}

const listAccounts = async (tenantId, filters = {}) => {
  const { type, isActive, withBalance, asOfDate } = filters;
  const where = { tenant_id: tenantId };
  if (type) where.type = type;
  if (isActive !== undefined) where.is_active = isActive === 'true' || isActive === true;

  const accounts = await db.ChartOfAccounts.findAll({
    where,
    order: [['sort_order', 'ASC'], ['code', 'ASC']],
  });

  if (!withBalance) return accounts;

  // Attach current balance from journal entry lines
  const dateFilter = asOfDate ? `AND je.entry_date <= '${asOfDate}'` : '';
  const [balances] = await db.sequelize.query(`
    SELECT
      jel.account_id,
      SUM(jel.debit)  AS total_debit,
      SUM(jel.credit) AS total_credit
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
      AND je.tenant_id = ? AND je.status = 'posted' ${dateFilter}
    GROUP BY jel.account_id
  `, { replacements: [tenantId] });

  const balMap = {};
  for (const b of balances) balMap[b.account_id] = b;

  return accounts.map((a) => {
    const plain = a.get({ plain: true });
    const bal = balMap[a.id];
    if (bal) {
      plain.total_debit = parseFloat(bal.total_debit) || 0;
      plain.total_credit = parseFloat(bal.total_credit) || 0;
      plain.balance = a.normal_balance === 'debit'
        ? plain.total_debit - plain.total_credit
        : plain.total_credit - plain.total_debit;
    } else {
      plain.total_debit = 0;
      plain.total_credit = 0;
      plain.balance = 0;
    }
    return plain;
  });
};

const getAccountById = async (tenantId, id) => {
  const acc = await db.ChartOfAccounts.findOne({ where: { id, tenant_id: tenantId } });
  if (!acc) throw ApiError.notFound('Account not found');
  return acc;
};

const createAccount = async (tenantId, userId, body) => {
  const { code, name, type, subType, normalBalance, isGroup = false, parentId, description, sortOrder } = body;
  if (!code || !name || !type || !normalBalance) throw ApiError.badRequest('code, name, type, normalBalance are required');
  const dup = await db.ChartOfAccounts.findOne({ where: { tenant_id: tenantId, code } });
  if (dup) throw ApiError.conflict(`Account code '${code}' already exists`);

  const acc = await db.ChartOfAccounts.create({
    tenant_id: tenantId,
    code,
    name,
    type,
    sub_type: subType || null,
    normal_balance: normalBalance,
    is_group: isGroup ? 1 : 0,
    parent_id: parentId || null,
    is_system: false,
    is_active: true,
    description: description || null,
    sort_order: sortOrder || 0,
  });
  clearAccountCache(tenantId);
  return acc;
};

const updateAccount = async (tenantId, id, body) => {
  const acc = await getAccountById(tenantId, id);
  const { name, subType, description, sortOrder, isActive, parentId } = body;

  if (acc.is_system) {
    // System accounts: only allow name, description, sort changes
    if (body.code && body.code !== acc.code) throw ApiError.badRequest('Cannot change code of a system account');
    if (body.type && body.type !== acc.type) throw ApiError.badRequest('Cannot change type of a system account');
    if (body.normalBalance && body.normalBalance !== acc.normal_balance) throw ApiError.badRequest('Cannot change normal balance of a system account');
  }

  if (name !== undefined) acc.name = name;
  if (subType !== undefined) acc.sub_type = subType;
  if (description !== undefined) acc.description = description;
  if (sortOrder !== undefined) acc.sort_order = sortOrder;
  if (isActive !== undefined) acc.is_active = isActive;
  if (parentId !== undefined) acc.parent_id = parentId || null;

  await acc.save();
  clearAccountCache(tenantId);
  return acc;
};

const deleteAccount = async (tenantId, id) => {
  const acc = await getAccountById(tenantId, id);
  if (acc.is_system) throw ApiError.badRequest('Cannot delete a system account');

  const usage = await db.JournalEntryLine.count({ where: { account_id: id } });
  if (usage > 0) throw ApiError.badRequest('Cannot delete account — it has journal entry lines. Disable it instead.');

  acc.is_active = false;
  await acc.save();
  clearAccountCache(tenantId);
  return { disabled: true };
};

module.exports = {
  seedDefaultAccounts,
  listAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  DEFAULT_ACCOUNTS,
  EXPENSE_CATEGORY_TO_CODE,
};
