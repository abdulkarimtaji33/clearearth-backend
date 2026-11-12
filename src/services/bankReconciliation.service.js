/**
 * Bank reconciliation: tick the ledger lines of a cash/bank account that appear on the bank statement,
 * compare the cleared balance with the statement balance, and save the result. A completed
 * reconciliation locks its lines (they will not be offered again); nothing in the ledger changes.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { resolvePaymentAccount } = require('../utils/paymentAccount');

const EPS = 0.01;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const todayStr = () => new Date().toISOString().slice(0, 10);
const q = async (sql, replacements) => (await db.sequelize.query(sql, { replacements }))[0];

const LINE_SQL = `
  SELECT l.id, DATE_FORMAT(e.entry_date, '%Y-%m-%d') AS entry_date, e.entry_number, e.source_type,
         COALESCE(NULLIF(l.description, ''), e.description) AS description, e.description AS entry_description,
         l.debit, l.credit, (l.debit - l.credit) AS amount
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id AND e.status = 'posted'
   WHERE l.account_id = ? AND e.tenant_id = ?`;

const shapeLine = (r) => ({
  id: r.id, date: r.entry_date, entryNumber: r.entry_number, sourceType: r.source_type,
  description: r.description || r.entry_description || '', debit: round2(r.debit), credit: round2(r.credit), amount: round2(r.amount),
});

async function assertCashBank(tenantId, accountId) {
  if (!accountId) throw ApiError.badRequest('Choose the bank or cash account to reconcile');
  const acc = await resolvePaymentAccount(tenantId, { paymentAccountId: accountId });
  return acc;
}

/** Ledger lines already locked by a completed reconciliation. */
async function lockedLineIds(tenantId, accountId, excludeReconId) {
  const rows = await q(
    `SELECT i.journal_entry_line_id AS id FROM bank_reconciliation_items i
       JOIN bank_reconciliations r ON r.id = i.reconciliation_id
      WHERE i.tenant_id = ? AND r.account_id = ? AND r.status = 'completed' ${excludeReconId ? 'AND r.id <> ?' : ''}`,
    excludeReconId ? [tenantId, accountId, excludeReconId] : [tenantId, accountId]
  );
  return new Set(rows.map((r) => r.id));
}

async function openingClearedBalance(tenantId, accountId, excludeReconId) {
  const rows = await q(
    `SELECT COALESCE(SUM(i.amount), 0) AS bal FROM bank_reconciliation_items i
       JOIN bank_reconciliations r ON r.id = i.reconciliation_id
      WHERE i.tenant_id = ? AND r.account_id = ? AND r.status = 'completed' ${excludeReconId ? 'AND r.id <> ?' : ''}`,
    excludeReconId ? [tenantId, accountId, excludeReconId] : [tenantId, accountId]
  );
  return round2(rows[0].bal);
}

/** Everything the reconciliation screen needs for an account up to a statement date. */
const getWorkspace = async (tenantId, { accountId, statementDate, reconciliationId } = {}) => {
  const acc = await assertCashBank(tenantId, accountId);
  const asOf = statementDate || todayStr();
  let draft = null;
  if (reconciliationId) {
    draft = await db.BankReconciliation.findOne({ where: { id: reconciliationId, tenant_id: tenantId, account_id: acc.accountId } });
    if (!draft) throw ApiError.notFound('Reconciliation not found');
  } else {
    draft = await db.BankReconciliation.findOne({ where: { tenant_id: tenantId, account_id: acc.accountId, status: 'draft' }, order: [['id', 'DESC']] });
  }
  const locked = await lockedLineIds(tenantId, acc.accountId, draft && draft.id);
  const ticked = new Set();
  if (draft) {
    (await q('SELECT journal_entry_line_id AS id FROM bank_reconciliation_items WHERE reconciliation_id = ?', [draft.id])).forEach((r) => ticked.add(r.id));
  }
  const all = await q(`${LINE_SQL} AND e.entry_date <= ? ORDER BY e.entry_date ASC, l.id ASC`, [acc.accountId, tenantId, asOf]);
  const lines = all.filter((r) => !locked.has(r.id)).map((r) => ({ ...shapeLine(r), ticked: ticked.has(r.id) }));
  const bookBalance = round2(all.reduce((s, r) => s + parseFloat(r.amount), 0));
  return {
    account: { id: acc.accountId, code: acc.accountCode, name: acc.accountName },
    statementDate: asOf,
    openingClearedBalance: await openingClearedBalance(tenantId, acc.accountId, draft && draft.id),
    bookBalance,
    lines,
    draft: draft ? draft.get({ plain: true }) : null,
    lastCompleted: (await q(
      `SELECT id, DATE_FORMAT(statement_date, '%Y-%m-%d') AS statement_date, statement_balance FROM bank_reconciliations
        WHERE tenant_id = ? AND account_id = ? AND status = 'completed' ORDER BY statement_date DESC, id DESC LIMIT 1`,
      [tenantId, acc.accountId]
    ))[0] || null,
  };
};

const save = async (tenantId, userId, body = {}) => {
  const { id, accountId, statementDate, statementBalance, lineIds, notes, complete } = body;
  const acc = await assertCashBank(tenantId, accountId);
  if (!statementDate) throw ApiError.badRequest('Enter the statement date');
  if (statementBalance === undefined || statementBalance === null || statementBalance === '' || Number.isNaN(Number(statementBalance))) {
    throw ApiError.badRequest('Enter the closing balance shown on the bank statement');
  }
  const ids = [...new Set((lineIds || []).map((x) => parseInt(x, 10)).filter(Boolean))];

  const t = await db.sequelize.transaction();
  try {
    let rec = null;
    if (id) {
      rec = await db.BankReconciliation.findOne({ where: { id, tenant_id: tenantId, account_id: acc.accountId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!rec) throw ApiError.notFound('Reconciliation not found');
      if (rec.status === 'completed') throw ApiError.badRequest('This reconciliation is already completed and cannot be changed');
    }
    const locked = await lockedLineIds(tenantId, acc.accountId, rec && rec.id);
    let items = [];
    if (ids.length) {
      const rows = await db.sequelize.query(
        `${LINE_SQL} AND l.id IN (?) AND e.entry_date <= ?`,
        { replacements: [acc.accountId, tenantId, ids, statementDate], transaction: t }
      ).then((r) => r[0]);
      if (rows.length !== ids.length) throw ApiError.badRequest('Some ticked entries do not belong to this account or are dated after the statement date');
      if (rows.some((r) => locked.has(r.id))) throw ApiError.badRequest('Some ticked entries were already reconciled earlier');
      items = rows;
    }
    const opening = await openingClearedBalance(tenantId, acc.accountId, rec && rec.id);
    const ticked = round2(items.reduce((s, r) => s + parseFloat(r.amount), 0));
    const cleared = round2(opening + ticked);
    const diff = round2(parseFloat(statementBalance) - cleared);
    if (complete && Math.abs(diff) > EPS) {
      throw ApiError.badRequest(`The difference is AED ${diff.toFixed(2)}. Tick the missing entries (or fix the statement balance) until the difference is zero, or save it as a draft.`);
    }
    const payload = {
      tenant_id: tenantId, account_id: acc.accountId, statement_date: statementDate, statement_balance: round2(statementBalance),
      opening_cleared_balance: opening, cleared_balance: cleared, difference: diff,
      status: complete ? 'completed' : 'draft', notes: notes ? String(notes).trim() : null,
      completed_at: complete ? new Date() : null,
    };
    if (rec) await rec.update(payload, { transaction: t });
    else rec = await db.BankReconciliation.create({ ...payload, created_by: userId }, { transaction: t });
    await db.BankReconciliationItem.destroy({ where: { reconciliation_id: rec.id }, transaction: t });
    if (items.length) {
      await db.BankReconciliationItem.bulkCreate(items.map((r) => ({
        tenant_id: tenantId, reconciliation_id: rec.id, journal_entry_line_id: r.id, amount: round2(r.amount),
      })), { transaction: t });
    }
    await t.commit();
    return getReport(tenantId, rec.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const list = async (tenantId, { accountId } = {}) => {
  const rows = await db.BankReconciliation.findAll({
    where: { tenant_id: tenantId, ...(accountId ? { account_id: accountId } : {}) },
    include: [{ model: db.ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name'], required: false }],
    order: [['statement_date', 'DESC'], ['id', 'DESC']],
  });
  return rows.map((r) => r.get({ plain: true }));
};

/** The printable report: statement balance, cleared items, and what is still unreconciled. */
const getReport = async (tenantId, id) => {
  const rec = await db.BankReconciliation.findOne({
    where: { id, tenant_id: tenantId },
    include: [{ model: db.ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name'], required: false }, { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false }],
  });
  if (!rec) throw ApiError.notFound('Reconciliation not found');
  const r = rec.get({ plain: true });
  const date = String(r.statement_date).slice(0, 10);
  const tickedRows = await q(`${LINE_SQL} AND l.id IN (SELECT journal_entry_line_id FROM bank_reconciliation_items WHERE reconciliation_id = ?) ORDER BY e.entry_date, l.id`, [r.account_id, tenantId, id]);
  const lockedElsewhere = await lockedLineIds(tenantId, r.account_id, id);
  const tickedIds = new Set(tickedRows.map((x) => x.id));
  const upTo = await q(`${LINE_SQL} AND e.entry_date <= ? ORDER BY e.entry_date, l.id`, [r.account_id, tenantId, date]);
  const unreconciled = upTo.filter((x) => !tickedIds.has(x.id) && !lockedElsewhere.has(x.id)).map(shapeLine);
  const bookBalance = round2(upTo.reduce((s, x) => s + parseFloat(x.amount), 0));
  const unreconciledNet = round2(unreconciled.reduce((s, x) => s + x.amount, 0));
  const tenant = await db.Tenant.findByPk(tenantId, { attributes: ['id', 'name', 'company_name'] });
  return {
    ...r,
    statement_date: date,
    cleared: tickedRows.map(shapeLine),
    unreconciled,
    unreconciledNet,
    bookBalance,
    tenant: tenant ? tenant.get({ plain: true }) : null,
  };
};

module.exports = { getWorkspace, save, list, getReport };
