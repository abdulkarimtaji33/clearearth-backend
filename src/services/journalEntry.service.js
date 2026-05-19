/**
 * Journal Entry Service — the core double-entry GL engine.
 * Every financial transaction in the system ultimately creates entries here.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

// In-memory cache: tenantId -> Map<code, accountId>
const _accountCache = new Map();

/**
 * Resolve a system account code (e.g. '1100') to its DB id for a tenant.
 * Results are cached per tenant for the lifetime of the process.
 */
async function getSystemAccountId(tenantId, code) {
  if (!_accountCache.has(tenantId)) {
    _accountCache.set(tenantId, new Map());
  }
  const cache = _accountCache.get(tenantId);
  if (cache.has(code)) return cache.get(code);

  const account = await db.ChartOfAccounts.findOne({
    where: { tenant_id: tenantId, code },
    attributes: ['id'],
  });
  if (!account) throw new Error(`System account '${code}' not found for tenant ${tenantId}. Run COA seed first.`);
  cache.set(code, account.id);
  return account.id;
}

/** Invalidate the cache for a tenant (e.g. after seeding accounts) */
function clearAccountCache(tenantId) {
  _accountCache.delete(tenantId);
}

/** Generate the next JE number: JE-YYYY-00001 */
async function nextEntryNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const prefix = `JE-${year}-`;
  const [rows] = await db.sequelize.query(
    `SELECT entry_number FROM journal_entries
     WHERE tenant_id = ? AND entry_number LIKE ?
     ORDER BY entry_number DESC LIMIT 1`,
    { replacements: [tenantId, `${prefix}%`], transaction }
  );
  let seq = 1;
  if (rows && rows.length > 0) {
    const last = rows[0].entry_number;
    const n = parseInt(last.replace(prefix, ''), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

/**
 * Core journal entry creator.
 * @param {number} tenantId
 * @param {number} userId
 * @param {object} data - { entryDate, description, sourceType, sourceId, lines, autoReverse, reverseDate }
 *   lines: Array<{ accountId, debit, credit, description }>
 * @param {object} [transaction] - optional Sequelize transaction to join
 */
async function createJournalEntry(tenantId, userId, data, transaction = null) {
  const { entryDate, description, sourceType, sourceId, lines, autoReverse = false, reverseDate = null } = data;

  if (!entryDate) throw new Error('entryDate is required for journal entry');
  if (!description) throw new Error('description is required for journal entry');
  if (!Array.isArray(lines) || lines.length < 2) throw new Error('At least 2 lines required for a journal entry');

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry not balanced: debits ${totalDebit.toFixed(2)} ≠ credits ${totalCredit.toFixed(2)}`);
  }

  const ownTx = !transaction;
  const t = transaction || (await db.sequelize.transaction());

  try {
    const entryNumber = await nextEntryNumber(tenantId, t);

    const entry = await db.JournalEntry.create(
      {
        tenant_id: tenantId,
        entry_number: entryNumber,
        entry_date: entryDate,
        description,
        source_type: sourceType || 'manual',
        source_id: sourceId || null,
        status: 'posted',
        auto_reverse: autoReverse ? 1 : 0,
        reverse_date: autoReverse && reverseDate ? reverseDate : null,
        created_by: userId,
      },
      { transaction: t }
    );

    const lineRows = lines.map((l, idx) => ({
      journal_entry_id: entry.id,
      account_id: l.accountId,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
      description: l.description || null,
      sort_order: idx,
    }));

    await db.JournalEntryLine.bulkCreate(lineRows, { transaction: t });

    if (ownTx) await t.commit();
    return entry.id;
  } catch (e) {
    if (ownTx) await t.rollback();
    throw e;
  }
}

/**
 * Create an opening balance journal entry.
 * Balances array: [{ code, balance }] where balance is a signed amount
 * (positive = normal-side, negative = contra-side).
 * Retained Earnings (3100) absorbs any net difference automatically.
 */
async function createOpeningBalanceEntry(tenantId, userId, { entryDate, balances }) {
  if (!Array.isArray(balances) || balances.length === 0) {
    throw ApiError.badRequest('balances array is required');
  }

  // Check if opening balance already posted
  const existing = await db.JournalEntry.findOne({
    where: { tenant_id: tenantId, source_type: 'opening_balance' },
  });
  if (existing) throw ApiError.conflict('Opening balances have already been posted for this tenant');

  const lines = [];
  let netDebit = 0;
  let netCredit = 0;

  for (const b of balances) {
    const account = await db.ChartOfAccounts.findOne({
      where: { tenant_id: tenantId, code: b.code, is_group: false },
    });
    if (!account) continue;
    const amt = parseFloat(b.balance) || 0;
    if (Math.abs(amt) < 0.01) continue;

    if (account.normal_balance === 'debit') {
      if (amt >= 0) {
        lines.push({ accountId: account.id, debit: amt, credit: 0 });
        netDebit += amt;
      } else {
        lines.push({ accountId: account.id, debit: 0, credit: Math.abs(amt) });
        netCredit += Math.abs(amt);
      }
    } else {
      if (amt >= 0) {
        lines.push({ accountId: account.id, debit: 0, credit: amt });
        netCredit += amt;
      } else {
        lines.push({ accountId: account.id, debit: Math.abs(amt), credit: 0 });
        netDebit += Math.abs(amt);
      }
    }
  }

  // Balance via Retained Earnings (3100)
  const diff = Math.abs(netDebit - netCredit);
  if (diff > 0.01) {
    const reId = await getSystemAccountId(tenantId, '3100');
    if (netDebit > netCredit) {
      lines.push({ accountId: reId, credit: diff, debit: 0, description: 'Opening balance plug' });
    } else {
      lines.push({ accountId: reId, debit: diff, credit: 0, description: 'Opening balance plug' });
    }
  }

  if (lines.length < 2) throw ApiError.badRequest('At least 2 accounts with non-zero balances are required');

  return createJournalEntry(tenantId, userId, {
    entryDate,
    description: 'Opening Balances',
    sourceType: 'opening_balance',
    sourceId: null,
    lines,
  });
}

const listJournalEntries = async (tenantId, filters = {}) => {
  const { offset = 0, limit = 20, dateFrom, dateTo, sourceType, search, accountId } = filters;

  const where = { tenant_id: tenantId };
  if (dateFrom) where.entry_date = { ...(where.entry_date || {}), [Op.gte]: dateFrom };
  if (dateTo) where.entry_date = { ...(where.entry_date || {}), [Op.lte]: dateTo };
  if (sourceType) where.source_type = sourceType;
  if (search) where.description = { [Op.like]: `%${search}%` };

  let include = [
    { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    {
      model: db.JournalEntryLine,
      as: 'lines',
      required: accountId ? true : false,
      where: accountId ? { account_id: accountId } : undefined,
      include: [{ model: db.ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name', 'type', 'normal_balance'] }],
    },
  ];

  const { count, rows } = await db.JournalEntry.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order: [['entry_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
  });

  // Compute totals per entry
  const result = rows.map((r) => {
    const plain = r.get({ plain: true });
    plain.total_debit = (plain.lines || []).reduce((s, l) => s + parseFloat(l.debit || 0), 0);
    plain.total_credit = (plain.lines || []).reduce((s, l) => s + parseFloat(l.credit || 0), 0);
    return plain;
  });

  return { entries: result, total: count };
};

const getJournalEntryById = async (tenantId, id) => {
  const entry = await db.JournalEntry.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      {
        model: db.JournalEntryLine,
        as: 'lines',
        include: [{ model: db.ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name', 'type', 'normal_balance', 'sub_type'] }],
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      },
    ],
  });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  return entry;
};

const createManualEntry = async (tenantId, userId, body) => {
  const { entryDate, description, lines, autoReverse = false, reverseDate = null } = body;
  if (!entryDate) throw ApiError.badRequest('entryDate is required');
  if (!description) throw ApiError.badRequest('description is required');
  if (!Array.isArray(lines) || lines.length < 2) throw ApiError.badRequest('At least 2 lines required');

  const parsedLines = lines.map((l) => ({
    accountId: l.accountId,
    debit: parseFloat(l.debit) || 0,
    credit: parseFloat(l.credit) || 0,
    description: l.description || null,
  }));

  // Validate accounts belong to this tenant and are not groups
  for (const l of parsedLines) {
    const acc = await db.ChartOfAccounts.findOne({ where: { id: l.accountId, tenant_id: tenantId } });
    if (!acc) throw ApiError.badRequest(`Account id ${l.accountId} not found`);
    if (acc.is_group) throw ApiError.badRequest(`Account '${acc.name}' is a group heading — cannot post to it`);
    if (!acc.is_active) throw ApiError.badRequest(`Account '${acc.name}' is inactive`);
  }

  const entryId = await createJournalEntry(tenantId, userId, {
    entryDate,
    description,
    sourceType: 'manual',
    sourceId: null,
    lines: parsedLines,
    autoReverse,
    reverseDate,
  });

  return getJournalEntryById(tenantId, entryId);
};

const voidJournalEntry = async (tenantId, userId, id) => {
  const entry = await db.JournalEntry.findOne({ where: { id, tenant_id: tenantId }, include: [{ model: db.JournalEntryLine, as: 'lines' }] });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status === 'voided') throw ApiError.conflict('Entry is already voided');

  const t = await db.sequelize.transaction();
  try {
    await entry.update({ status: 'voided', voided_at: new Date(), voided_by: userId }, { transaction: t });

    // Create reversing entry
    const reversingLines = entry.lines.map((l) => ({
      accountId: l.account_id,
      debit: parseFloat(l.credit) || 0,
      credit: parseFloat(l.debit) || 0,
      description: l.description,
    }));

    const revId = await createJournalEntry(
      tenantId,
      userId,
      {
        entryDate: entry.entry_date,
        description: `VOID: ${entry.description}`,
        sourceType: entry.source_type,
        sourceId: entry.source_id,
        lines: reversingLines,
      },
      t
    );

    await entry.update({ reversed_by_id: revId }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  return getJournalEntryById(tenantId, id);
};

module.exports = {
  createJournalEntry,
  createOpeningBalanceEntry,
  createManualEntry,
  listJournalEntries,
  getJournalEntryById,
  voidJournalEntry,
  getSystemAccountId,
  clearAccountCache,
};
