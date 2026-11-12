/**
 * Supplier advances — money paid to a supplier before its bill exists.
 *   Record:  Dr 1350 Advances to Suppliers / Cr cash or bank.
 *   Apply:   Dr 2000 Accounts Payable / Cr 1350 (reduces the bill's balance).
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const paymentTxService = require('./paymentTransaction.service');
const { resolvePaymentAccount, assertNotOverdrawn } = require('../utils/paymentAccount');

const EPS = 0.01;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const todayStr = () => new Date().toISOString().slice(0, 10);

const ADVANCE_CODE = '1350';

/** The asset account that holds advances. Created on first use for tenants that do not have it. */
async function ensureAdvanceAccount(tenantId, transaction) {
  let acc = await db.ChartOfAccounts.findOne({ where: { tenant_id: tenantId, code: ADVANCE_CODE }, transaction });
  if (!acc) {
    acc = await db.ChartOfAccounts.create({
      tenant_id: tenantId,
      code: ADVANCE_CODE,
      name: 'Advances to Suppliers',
      type: 'asset',
      sub_type: 'current_asset',
      normal_balance: 'debit',
      is_group: false,
      is_system: true,
      is_active: true,
      sort_order: 45,
    }, { transaction });
    jeService.clearAccountCache && jeService.clearAccountCache(tenantId);
  }
  return acc.id;
}

const advanceIncludes = () => [
  { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
  { model: db.ChartOfAccounts, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
  { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
];

const withRemaining = (row) => {
  const o = row.get ? row.get({ plain: true }) : row;
  o.remaining = Math.max(0, round2(parseFloat(o.amount) - parseFloat(o.applied_amount || 0)));
  o.party_name = (o.supplier && o.supplier.company_name) || '—';
  return o;
};

async function nextNumber(tenantId, transaction) {
  const count = await db.SupplierAdvance.count({ where: { tenant_id: tenantId }, transaction });
  return `ADV/CE/${new Date().getFullYear()}/${count + 1}`;
}

const recordAdvance = async (tenantId, userId, body = {}) => {
  const { supplierId, amount, advanceDate, paymentMethod, paymentAccountId, referenceNo, notes, confirmNegative } = body;
  if (!supplierId) throw ApiError.badRequest('Choose the supplier');
  const amt = round2(amount);
  if (!(amt > EPS)) throw ApiError.badRequest('Enter an advance amount greater than zero');
  if (!paymentAccountId) throw ApiError.badRequest('Choose the cash or bank account the advance is paid from');
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId }, attributes: ['id', 'company_name'] });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  const date = advanceDate || todayStr();
  await jeService.assertPostingDateOpen(tenantId, date);
  const pay = await resolvePaymentAccount(tenantId, { paymentMethod, paymentAccountId });
  await assertNotOverdrawn(tenantId, pay.accountId, amt, confirmNegative);

  const t = await db.sequelize.transaction();
  try {
    const advAccId = await ensureAdvanceAccount(tenantId, t);
    const number = await nextNumber(tenantId, t);
    const adv = await db.SupplierAdvance.create({
      tenant_id: tenantId,
      advance_number: number,
      supplier_id: supplier.id,
      advance_date: date,
      amount: amt,
      applied_amount: 0,
      payment_account_id: pay.accountId,
      payment_method: paymentMethod || null,
      reference_no: referenceNo || null,
      notes: notes ? String(notes).trim() : null,
      created_by: userId,
    }, { transaction: t });

    const entryId = await jeService.createJournalEntry(tenantId, userId, {
      entryDate: date,
      description: `Advance ${number} to ${supplier.company_name}`,
      sourceType: 'supplier_advance',
      sourceId: adv.id,
      paidTo: supplier.company_name,
      lines: [
        { accountId: advAccId, debit: amt, credit: 0, description: `Supplier: ${supplier.company_name}` },
        { accountId: pay.accountId, debit: 0, credit: amt, description: `Advance ${number}` },
      ],
    }, t);
    await adv.update({ journal_entry_id: entryId }, { transaction: t });

    const tx = await paymentTxService.createPaymentTransaction(tenantId, userId, {
      sourceType: 'supplier_advance',
      sourceId: adv.id,
      amount: amt,
      paymentMethod,
      paymentAccountId: pay.accountId,
      referenceNo,
      paidTo: supplier.company_name,
      notes,
      paidAt: date,
    }, t);
    await tx.update({ journal_entry_id: entryId }, { transaction: t });

    await t.commit();
    return getAdvance(tenantId, adv.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const getAdvance = async (tenantId, id) => {
  const row = await db.SupplierAdvance.findOne({ where: { id, tenant_id: tenantId }, include: advanceIncludes() });
  if (!row) throw ApiError.notFound('Advance not found');
  const o = withRemaining(row);
  const apps = await db.SupplierAdvanceApplication.findAll({
    where: { advance_id: id, tenant_id: tenantId },
    include: [{ model: db.VendorBill, as: 'vendorBill', attributes: ['id', 'bill_number', 'supplier_invoice_no'], required: false }],
    order: [['applied_at', 'ASC'], ['id', 'ASC']],
  });
  o.applications = apps.map((a) => a.get({ plain: true }));
  return o;
};

const listAdvances = async (tenantId, filters = {}) => {
  const { offset, limit, search, supplierId, openOnly } = filters;
  const where = { tenant_id: tenantId };
  if (supplierId) where.supplier_id = supplierId;
  if (openOnly === true || openOnly === 'true') where[Op.and] = [db.sequelize.literal('amount - applied_amount > 0.005')];
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [{ advance_number: { [Op.like]: s } }, { reference_no: { [Op.like]: s } }, { '$supplier.company_name$': { [Op.like]: s } }];
  }
  const { count, rows } = await db.SupplierAdvance.findAndCountAll({
    where,
    include: advanceIncludes(),
    offset,
    limit,
    order: [['advance_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
    subQuery: false,
  });
  return { advances: rows.map(withRemaining), total: count };
};

/** Open bills of a supplier that an advance can be applied to, with the supplier's unused advance. */
const getApplyOptions = async (tenantId, supplierId) => {
  const advances = (await db.SupplierAdvance.findAll({
    where: { tenant_id: tenantId, supplier_id: supplierId },
    order: [['advance_date', 'ASC'], ['id', 'ASC']],
  })).map(withRemaining).filter((a) => a.remaining > EPS);
  const bills = (await db.VendorBill.findAll({
    where: { tenant_id: tenantId, supplier_id: supplierId, status: { [Op.in]: ['open', 'partial'] } },
    order: [['bill_date', 'ASC'], ['id', 'ASC']],
  })).map((b) => {
    const o = b.get({ plain: true });
    o.balance_due = Math.max(0, round2(parseFloat(o.total) - parseFloat(o.paid_amount || 0) - parseFloat(o.debit_note_amount || 0)));
    return o;
  }).filter((b) => b.balance_due > EPS);
  return {
    advances,
    bills,
    availableTotal: round2(advances.reduce((s, a) => s + a.remaining, 0)),
  };
};

const applyAdvance = async (tenantId, userId, advanceId, body = {}) => {
  const { vendorBillId, amount, appliedAt } = body;
  if (!vendorBillId) throw ApiError.badRequest('Choose the bill to apply the advance to');
  const date = appliedAt || todayStr();
  await jeService.assertPostingDateOpen(tenantId, date);

  const t = await db.sequelize.transaction();
  try {
    const adv = await db.SupplierAdvance.findOne({ where: { id: advanceId, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!adv) throw ApiError.notFound('Advance not found');
    const bill = await db.VendorBill.findOne({ where: { id: vendorBillId, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!bill) throw ApiError.notFound('Vendor bill not found');
    if (bill.supplier_id !== adv.supplier_id) throw ApiError.badRequest('The advance and the bill belong to different suppliers');
    if (bill.status === 'void' || bill.status === 'paid') throw ApiError.badRequest(`${bill.bill_number} is not open`);
    if (String(date) < String(adv.advance_date).slice(0, 10)) throw ApiError.badRequest('The advance cannot be applied before the date it was paid');

    const remaining = round2(parseFloat(adv.amount) - parseFloat(adv.applied_amount || 0));
    const balance = round2(parseFloat(bill.total) - parseFloat(bill.paid_amount || 0) - parseFloat(bill.debit_note_amount || 0));
    const amt = amount === undefined || amount === null || amount === '' ? Math.min(remaining, balance) : round2(amount);
    if (!(amt > EPS)) throw ApiError.badRequest('Nothing to apply: enter an amount greater than zero');
    if (amt > remaining + EPS) throw ApiError.badRequest(`Only AED ${remaining.toFixed(2)} of this advance is left`);
    if (amt > balance + EPS) throw ApiError.badRequest(`The bill only has AED ${balance.toFixed(2)} left to pay`);

    const advAccId = await ensureAdvanceAccount(tenantId, t);
    const apId = await jeService.getSystemAccountId(tenantId, '2000');
    const supplier = await db.Supplier.findOne({ where: { id: adv.supplier_id, tenant_id: tenantId }, attributes: ['company_name'], transaction: t });
    const entryId = await jeService.createJournalEntry(tenantId, userId, {
      entryDate: date,
      description: `Advance ${adv.advance_number} applied to ${bill.bill_number}`,
      sourceType: 'supplier_advance_applied',
      sourceId: adv.id,
      paidTo: supplier ? supplier.company_name : null,
      lines: [
        { accountId: apId, debit: amt, credit: 0, description: supplier ? `Supplier: ${supplier.company_name}` : undefined },
        { accountId: advAccId, debit: 0, credit: amt, description: `Advance ${adv.advance_number}` },
      ],
    }, t);

    await db.SupplierAdvanceApplication.create({
      tenant_id: tenantId, advance_id: adv.id, vendor_bill_id: bill.id, amount: amt, applied_at: date, journal_entry_id: entryId, created_by: userId,
    }, { transaction: t });
    await adv.update({ applied_amount: round2(parseFloat(adv.applied_amount || 0) + amt) }, { transaction: t });

    const paid = round2(parseFloat(bill.paid_amount || 0) + amt);
    const settled = paid + parseFloat(bill.debit_note_amount || 0) >= parseFloat(bill.total) - EPS;
    await bill.update({ paid_amount: paid, status: settled ? 'paid' : 'partial' }, { transaction: t });

    await t.commit();
    return getAdvance(tenantId, adv.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

/** Unused advance per supplier (for the Suppliers list and the statement). */
const advanceBalancesBySupplier = async (tenantId) => {
  const rows = await db.SupplierAdvance.findAll({ where: { tenant_id: tenantId }, attributes: ['supplier_id', 'amount', 'applied_amount'] });
  const map = {};
  rows.forEach((r) => {
    map[r.supplier_id] = round2((map[r.supplier_id] || 0) + parseFloat(r.amount) - parseFloat(r.applied_amount || 0));
  });
  return map;
};

module.exports = { ensureAdvanceAccount, recordAdvance, getAdvance, listAdvances, getApplyOptions, applyAdvance, advanceBalancesBySupplier };
