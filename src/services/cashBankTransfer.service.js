/**
 * Transfers between cash and bank accounts (cash to bank, bank to cash, bank to bank).
 * Posts Dr to-account / Cr from-account. Not an income or an expense.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const { resolvePaymentAccount, assertNotOverdrawn } = require('../utils/paymentAccount');

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const todayStr = () => new Date().toISOString().slice(0, 10);

const includes = () => [
  { model: db.ChartOfAccounts, as: 'fromAccount', attributes: ['id', 'code', 'name'], required: false },
  { model: db.ChartOfAccounts, as: 'toAccount', attributes: ['id', 'code', 'name'], required: false },
  { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
];

const createTransfer = async (tenantId, userId, body = {}) => {
  const { fromAccountId, toAccountId, amount, transferDate, referenceNo, notes, confirmNegative } = body;
  if (!fromAccountId) throw ApiError.badRequest('Choose the account the money leaves');
  if (!toAccountId) throw ApiError.badRequest('Choose the account the money goes to');
  if (String(fromAccountId) === String(toAccountId)) throw ApiError.badRequest('The two accounts must be different');
  const amt = round2(amount);
  if (!(amt > 0.004)) throw ApiError.badRequest('Enter an amount greater than zero');
  const date = transferDate || todayStr();
  await jeService.assertPostingDateOpen(tenantId, date);
  const from = await resolvePaymentAccount(tenantId, { paymentAccountId: fromAccountId });
  const to = await resolvePaymentAccount(tenantId, { paymentAccountId: toAccountId });
  await assertNotOverdrawn(tenantId, from.accountId, amt, confirmNegative);

  const t = await db.sequelize.transaction();
  try {
    const count = await db.CashBankTransfer.count({ where: { tenant_id: tenantId }, transaction: t });
    const number = `TRF/CE/${new Date().getFullYear()}/${count + 1}`;
    const row = await db.CashBankTransfer.create({
      tenant_id: tenantId, transfer_number: number, transfer_date: date, from_account_id: from.accountId,
      to_account_id: to.accountId, amount: amt, reference_no: referenceNo || null,
      notes: notes ? String(notes).trim() : null, created_by: userId,
    }, { transaction: t });
    const entryId = await jeService.createJournalEntry(tenantId, userId, {
      entryDate: date,
      description: `Transfer ${number}: ${from.accountCode} ${from.accountName} to ${to.accountCode} ${to.accountName}`,
      sourceType: 'cash_bank_transfer',
      sourceId: row.id,
      lines: [
        { accountId: to.accountId, debit: amt, credit: 0, description: `Transfer ${number} in` },
        { accountId: from.accountId, debit: 0, credit: amt, description: `Transfer ${number} out` },
      ],
    }, t);
    await row.update({ journal_entry_id: entryId }, { transaction: t });
    await t.commit();
    return getTransfer(tenantId, row.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const getTransfer = async (tenantId, id) => {
  const row = await db.CashBankTransfer.findOne({ where: { id, tenant_id: tenantId }, include: includes() });
  if (!row) throw ApiError.notFound('Transfer not found');
  return row.get({ plain: true });
};

const listTransfers = async (tenantId, { offset, limit, search, accountId, dateFrom, dateTo } = {}) => {
  const where = { tenant_id: tenantId };
  if (accountId) where[Op.or] = [{ from_account_id: accountId }, { to_account_id: accountId }];
  if (dateFrom) where.transfer_date = { ...(where.transfer_date || {}), [Op.gte]: dateFrom };
  if (dateTo) where.transfer_date = { ...(where.transfer_date || {}), [Op.lte]: dateTo };
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.and] = [{ [Op.or]: [{ transfer_number: { [Op.like]: s } }, { reference_no: { [Op.like]: s } }, { notes: { [Op.like]: s } }] }];
  }
  const { count, rows } = await db.CashBankTransfer.findAndCountAll({
    where, include: includes(), offset, limit, order: [['transfer_date', 'DESC'], ['id', 'DESC']], distinct: true,
  });
  return { transfers: rows.map((r) => r.get({ plain: true })), total: count };
};

module.exports = { createTransfer, getTransfer, listTransfers };
