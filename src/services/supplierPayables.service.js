/**
 * Supplier-wise payables: what we owe each supplier, its aging, and its statement of account.
 * Open items are supplier bills (vendor_bills) plus older approved POs that are still paid per PO.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const payablesService = require('./payables.service');
const { daysOverdue } = require('../utils/aging');

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Supplier aging buckets, by days past the due date (a bill that is not due yet counts as 0-30). */
const BUCKETS = ['b0_30', 'b31_60', 'b61_90', 'b90_plus'];
const emptyBuckets = () => ({ b0_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0 });
function bucketFor(pastDue) {
  const d = pastDue == null ? 0 : pastDue;
  if (d <= 30) return 'b0_30';
  if (d <= 60) return 'b31_60';
  if (d <= 90) return 'b61_90';
  return 'b90_plus';
}

const keyOf = (supplierId, companyId) => (supplierId ? `s:${supplierId}` : companyId ? `c:${companyId}` : 'none');

/** Every unpaid bill / PO, with its balance and age, as of `asOf`. */
async function openItems(tenantId, asOf = todayStr()) {
  const asOfDate = new Date(`${asOf}T12:00:00`);
  const items = [];

  const bills = await db.VendorBill.findAll({
    where: { tenant_id: tenantId, status: { [Op.in]: ['open', 'partial'] } },
    include: [
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    ],
    order: [['bill_date', 'ASC'], ['id', 'ASC']],
  });
  bills.forEach((b) => {
    const o = b.get({ plain: true });
    const balance = round2(parseFloat(o.total) - parseFloat(o.paid_amount || 0) - parseFloat(o.debit_note_amount || 0));
    if (balance <= 0.005) return;
    const due = o.due_date || o.bill_date;
    items.push({
      kind: 'bill',
      id: o.id,
      number: o.bill_number,
      reference: o.supplier_invoice_no,
      supplierId: o.supplier_id || null,
      companyId: o.company_id || null,
      partyName: o.supplier?.company_name || o.company?.company_name || '—',
      date: String(o.bill_date).slice(0, 10),
      dueDate: o.due_date ? String(o.due_date).slice(0, 10) : null,
      total: round2(o.total),
      paid: round2(o.paid_amount),
      balance,
      daysPastDue: Math.max(0, daysOverdue(String(due).slice(0, 10), asOfDate) ?? 0),
    });
  });

  // Older purchase orders that are still paid directly per PO (before supplier bills existed).
  const { payables } = await payablesService.listPayables(tenantId, { offset: 0, limit: 100000 });
  payables.forEach((p) => {
    const bal = round2(p.balance_due);
    if (bal <= 0.005) return;
    const due = p.due_date || p.po_date;
    items.push({
      kind: 'po',
      id: p.id,
      number: `PO #${p.id}`,
      reference: '',
      supplierId: p.supplier_id || null,
      companyId: p.company_id || null,
      partyName: p.party_name,
      date: String(p.po_date).slice(0, 10),
      dueDate: p.due_date ? String(p.due_date).slice(0, 10) : null,
      total: round2(p.po_total),
      paid: round2(p.paid_amount),
      balance: bal,
      daysPastDue: Math.max(0, daysOverdue(String(due).slice(0, 10), asOfDate) ?? 0),
    });
  });
  return items;
}

/** Outstanding bills grouped by supplier, with totals and aging per supplier. */
const listBySupplier = async (tenantId, { asOf, search } = {}) => {
  const items = await openItems(tenantId, asOf || todayStr());
  const groups = {};
  items.forEach((it) => {
    const k = keyOf(it.supplierId, it.companyId);
    const g = groups[k] || (groups[k] = {
      key: k, supplierId: it.supplierId, companyId: it.companyId, name: it.partyName,
      billCount: 0, total: 0, overdue: 0, buckets: emptyBuckets(), items: [],
    });
    g.billCount += 1;
    g.total = round2(g.total + it.balance);
    if (it.daysPastDue > 0) g.overdue = round2(g.overdue + it.balance);
    g.buckets[bucketFor(it.daysPastDue)] = round2(g.buckets[bucketFor(it.daysPastDue)] + it.balance);
    g.items.push(it);
  });
  let list = Object.values(groups).sort((a, b) => b.total - a.total);
  const q = search ? String(search).trim().toLowerCase() : '';
  if (q) list = list.filter((g) => g.name.toLowerCase().includes(q));
  const totals = list.reduce((t, g) => {
    t.total = round2(t.total + g.total);
    t.overdue = round2(t.overdue + g.overdue);
    t.billCount += g.billCount;
    BUCKETS.forEach((b) => { t.buckets[b] = round2(t.buckets[b] + g.buckets[b]); });
    return t;
  }, { total: 0, overdue: 0, billCount: 0, buckets: emptyBuckets() });
  return { suppliers: list, totals, asOf: asOf || todayStr() };
};

/** { supplierId: outstanding } for the Suppliers list balance column. */
const balancesBySupplier = async (tenantId) => {
  const items = await openItems(tenantId);
  const map = {};
  items.forEach((it) => { if (it.supplierId) map[it.supplierId] = round2((map[it.supplierId] || 0) + it.balance); });
  return map;
};

/**
 * Statement of account for one supplier: bills raise the balance, payments (and later debit notes and
 * advances) lower it. Same shape as the customer statement.
 */
const getSupplierStatement = async (tenantId, supplierId, { dateFrom, dateTo } = {}) => {
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const entries = [];

  const bills = await db.VendorBill.findAll({
    where: { tenant_id: tenantId, supplier_id: supplier.id, status: { [Op.ne]: 'void' } },
    order: [['bill_date', 'ASC'], ['id', 'ASC']],
  });
  const billIds = bills.map((b) => b.id);
  bills.forEach((b) => {
    entries.push({
      date: String(b.bill_date).slice(0, 10),
      docType: 'Bill',
      details: `${b.bill_number} · invoice ${b.supplier_invoice_no}`,
      dueDate: b.due_date ? String(b.due_date).slice(0, 10) : null,
      amount: round2(b.total),
      paid: 0,
      link: { type: 'vendor_bill', id: b.id },
    });
  });
  const payments = billIds.length
    ? await db.PaymentTransaction.findAll({
      where: { tenant_id: tenantId, source_type: 'vendor_bill', source_id: { [Op.in]: billIds } },
      include: [
        { model: db.ChartOfAccounts, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: db.JournalEntry, as: 'journalEntry', attributes: ['id', 'entry_number'], required: false },
      ],
      order: [['paid_at', 'ASC'], ['id', 'ASC']],
    })
    : [];
  const billById = Object.fromEntries(bills.map((b) => [b.id, b]));
  payments.forEach((p) => {
    const b = billById[p.source_id];
    entries.push({
      date: String(p.paid_at || p.createdAt || '').slice(0, 10),
      docType: 'Payment',
      details: `${b ? b.bill_number : ''}${p.paymentAccount ? ` · from ${p.paymentAccount.code} ${p.paymentAccount.name}` : ''}${p.reference_no ? ` · ref ${p.reference_no}` : ''}`,
      amount: 0,
      paid: round2(p.amount),
      link: { type: 'journal', id: p.journalEntry ? p.journalEntry.id : null, number: p.journalEntry ? p.journalEntry.entry_number : null },
    });
  });

  // Older POs that are paid per PO.
  const pos = await db.PurchaseOrder.findAll({
    where: { tenant_id: tenantId, supplier_id: supplier.id, status: 'approved', bill_flow: false },
    include: [{ model: db.PurchaseOrderItem, as: 'items', required: false }],
  });
  const poPayments = pos.length
    ? await db.PaymentTransaction.findAll({
      where: { tenant_id: tenantId, source_type: 'payable', source_id: { [Op.in]: pos.map((p) => p.id) } },
      order: [['paid_at', 'ASC'], ['id', 'ASC']],
    })
    : [];
  pos.forEach((p) => {
    const total = round2((p.items || []).reduce((s, it) => s + (parseFloat(it.total) || 0), 0));
    if (total <= 0.005) return;
    entries.push({ date: String(p.po_date).slice(0, 10), docType: 'Purchase order', details: `PO #${p.id}`, dueDate: p.due_date ? String(p.due_date).slice(0, 10) : null, amount: total, paid: 0, link: { type: 'po', id: p.id } });
  });
  poPayments.forEach((p) => {
    entries.push({ date: String(p.paid_at || '').slice(0, 10), docType: 'Payment', details: `PO #${p.source_id}${p.reference_no ? ` · ref ${p.reference_no}` : ''}`, amount: 0, paid: round2(p.amount), link: { type: 'po', id: p.source_id } });
  });

  // Hook for debit notes and advances (added with those features).
  const extra = await supplierExtraEntries(tenantId, supplier.id);
  extra.forEach((e) => entries.push(e));

  const rank = { Bill: 0, 'Purchase order': 0, Advance: 1, 'Debit note': 2, Payment: 3 };
  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (rank[a.docType] ?? 9) - (rank[b.docType] ?? 9)));

  const from = dateFrom || (entries[0] && entries[0].date) || todayStr();
  const to = dateTo || todayStr();
  let opening = 0;
  const inRange = [];
  entries.forEach((e) => {
    if (e.date < from) opening += e.amount - e.paid;
    else if (e.date <= to) inRange.push(e);
  });
  opening = round2(opening);
  let running = opening;
  const transactions = inRange.map((e) => {
    running = round2(running + e.amount - e.paid);
    return { ...e, balance: running };
  });

  const billedTotal = round2(entries.reduce((s, e) => s + e.amount, 0));
  const paidTotal = round2(entries.reduce((s, e) => s + e.paid, 0));

  // Aging of what is still open, as of `to`.
  const open = (await openItems(tenantId, to)).filter((it) => it.supplierId === supplier.id);
  const aging = emptyBuckets();
  open.forEach((it) => { aging[bucketFor(it.daysPastDue)] = round2(aging[bucketFor(it.daysPastDue)] + it.balance); });

  return {
    supplier: supplier.get({ plain: true }),
    dateFrom: from,
    dateTo: to,
    openingBalance: opening,
    transactions,
    balanceDue: round2(billedTotal - paidTotal),
    billedTotal,
    paidTotal,
    aging,
    openItems: open,
    currency: 'AED',
  };
};

// Extended by debit notes / advances (phase 5); returns extra statement entries for a supplier.
async function supplierExtraEntries(tenantId, supplierId) {
  const entries = [];
  const notes = await db.SupplierDebitNote.findAll({
    where: { tenant_id: tenantId, supplier_id: supplierId },
    include: [{ model: db.VendorBill, as: 'vendorBill', attributes: ['bill_number'], required: false }],
  });
  notes.forEach((n) => {
    entries.push({
      date: String(n.note_date).slice(0, 10),
      docType: 'Debit note',
      details: `${n.debit_note_number} · ${n.vendorBill ? n.vendorBill.bill_number : ''} · ${n.reason}`,
      amount: 0,
      paid: round2(n.total),
      link: { type: 'debit_note', id: n.id },
    });
  });
  const advances = await db.SupplierAdvance.findAll({ where: { tenant_id: tenantId, supplier_id: supplierId } });
  advances.forEach((a) => {
    entries.push({
      date: String(a.advance_date).slice(0, 10),
      docType: 'Advance',
      details: `${a.advance_number}${a.reference_no ? ` · ref ${a.reference_no}` : ''}`,
      amount: 0,
      paid: round2(a.amount),
      link: { type: 'advance', id: a.id },
    });
  });
  return entries;
}

module.exports = { listBySupplier, balancesBySupplier, getSupplierStatement, openItems, BUCKETS, bucketFor, emptyBuckets };
