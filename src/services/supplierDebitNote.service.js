/**
 * Supplier debit notes — a return or overcharge against a supplier bill.
 *   Dr 2000 Accounts Payable / Cr the bill's expense account + Cr 1200 Input VAT.
 * The debit note reduces the bill's balance. Only the unpaid part of a bill can be debited here.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');

const EPS = 0.01;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

const REASONS = [
  'Goods returned',
  'Overcharged / wrong price',
  'Damaged or faulty goods',
  'Service not delivered',
  'Discount received',
  'Other',
];

const includes = () => [
  { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name', 'vat_number'], required: false },
  { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
  { model: db.VendorBill, as: 'vendorBill', attributes: ['id', 'bill_number', 'supplier_invoice_no', 'bill_date'], required: false },
  { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
];

function billNumbers(bill) {
  const total = round2(bill.total);
  const paid = round2(bill.paid_amount);
  const debited = round2(bill.debit_note_amount);
  const outstanding = Math.max(0, round2(total - paid - debited));
  const subtotal = round2(bill.subtotal);
  // VAT as a share of the bill's amount before VAT (works for 5%, manual and no VAT alike)
  const vatRatio = subtotal > 0 ? round2(bill.vat_amount) / subtotal : 0;
  return { total, paid, debited, outstanding, vatRatio };
}

const splitInclusive = (inclusive, vatRatio) => {
  const net = round2(inclusive / (1 + vatRatio));
  return { net, vat: round2(inclusive - net) };
};

/** The account the debit note credits: the bill's expense head; 2200 when the bill cleared a work order accrual. */
async function creditAccountFor(tenantId, bill) {
  if (bill.expense_id) return jeService.getSystemAccountId(tenantId, '2200');
  if (bill.expense_account_id) return bill.expense_account_id;
  if (bill.purchase_order_id) {
    const po = await db.PurchaseOrder.findOne({ where: { id: bill.purchase_order_id, tenant_id: tenantId }, attributes: ['expense_account_id'] });
    if (po && po.expense_account_id) return po.expense_account_id;
  }
  return jeService.getSystemAccountId(tenantId, '2200'); // older PO bills that cleared a PO accrual
}

const getBillDebitInfo = async (tenantId, billId) => {
  const bill = await db.VendorBill.findOne({
    where: { id: billId, tenant_id: tenantId },
    include: [
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    ],
  });
  if (!bill) throw ApiError.notFound('Vendor bill not found');
  const n = billNumbers(bill);
  const full = splitInclusive(n.outstanding, n.vatRatio);
  return {
    vendorBillId: bill.id,
    billNumber: bill.bill_number,
    supplierInvoiceNo: bill.supplier_invoice_no,
    supplierName: (bill.supplier && bill.supplier.company_name) || (bill.company && bill.company.company_name) || '—',
    billDate: bill.bill_date,
    currency: 'AED',
    vatPercentage: round2(n.vatRatio * 100),
    total: n.total,
    paid: n.paid,
    debited: n.debited,
    outstanding: n.outstanding,
    maxSubtotal: full.net,
    maxVat: full.vat,
    reasons: REASONS,
    canDebit: n.outstanding > EPS && bill.status !== 'void',
  };
};

async function nextNumber(tenantId, transaction) {
  const count = await db.SupplierDebitNote.count({ where: { tenant_id: tenantId }, transaction });
  return `DN/CE/${new Date().getFullYear()}/${count + 1}`;
}

const createDebitNote = async (tenantId, userId, body = {}) => {
  const { vendorBillId, reason, notes, noteDate, amountExVat } = body;
  if (!vendorBillId) throw ApiError.badRequest('Choose the supplier bill');
  if (!reason || !String(reason).trim()) throw ApiError.badRequest('Select a reason for the debit note');
  const date = noteDate || new Date().toISOString().slice(0, 10);
  await jeService.assertPostingDateOpen(tenantId, date);

  const t = await db.sequelize.transaction();
  try {
    const bill = await db.VendorBill.findOne({
      where: { id: vendorBillId, tenant_id: tenantId },
      include: [
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
        { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!bill) throw ApiError.notFound('Vendor bill not found');
    if (bill.status === 'void') throw ApiError.badRequest('This bill is void');
    if (String(date) < String(bill.bill_date).slice(0, 10)) {
      throw ApiError.badRequest(`The debit note date cannot be before the bill date (${String(bill.bill_date).slice(0, 10)})`);
    }
    const n = billNumbers(bill);
    if (n.outstanding <= EPS) throw ApiError.badRequest('This bill has nothing left to debit: it is already fully paid or credited');

    let net;
    let vat;
    if (amountExVat === undefined || amountExVat === null || amountExVat === '') {
      ({ net, vat } = splitInclusive(n.outstanding, n.vatRatio));
    } else {
      net = round2(amountExVat);
      if (!(net > 0)) throw ApiError.badRequest('Enter an amount greater than zero');
      vat = round2(net * n.vatRatio);
    }
    const total = round2(net + vat);
    if (total > n.outstanding + EPS) {
      throw ApiError.badRequest(`The debit note (AED ${total.toFixed(2)} incl. VAT) is more than the unpaid balance of the bill (AED ${n.outstanding.toFixed(2)})`);
    }

    const partyName = (bill.supplier && bill.supplier.company_name) || (bill.company && bill.company.company_name) || null;
    const creditAccountId = await creditAccountFor(tenantId, bill);
    const apId = await jeService.getSystemAccountId(tenantId, '2000');
    const number = await nextNumber(tenantId, t);

    const note = await db.SupplierDebitNote.create({
      tenant_id: tenantId,
      debit_note_number: number,
      vendor_bill_id: bill.id,
      supplier_id: bill.supplier_id || null,
      company_id: bill.company_id || null,
      note_date: date,
      reason: String(reason).trim().slice(0, 100),
      notes: notes ? String(notes).trim() : null,
      subtotal: net,
      vat_amount: vat,
      total,
      credit_account_id: creditAccountId,
      created_by: userId,
    }, { transaction: t });

    const lines = [{ accountId: apId, debit: total, credit: 0, description: partyName ? `Supplier: ${partyName}` : undefined }];
    lines.push({ accountId: creditAccountId, debit: 0, credit: net, description: `Debit note ${number}` });
    if (vat > 0.005) {
      lines.push({ accountId: await jeService.getSystemAccountId(tenantId, '1200'), debit: 0, credit: vat, description: `Input VAT reversed: ${number}` });
    }
    const entryId = await jeService.createJournalEntry(tenantId, userId, {
      entryDate: date,
      description: `Debit Note ${number} — ${bill.bill_number} (${String(reason).trim()})`,
      sourceType: 'supplier_debit_note',
      sourceId: note.id,
      paidTo: partyName,
      lines,
    }, t);
    await note.update({ journal_entry_id: entryId }, { transaction: t });

    const debited = round2(n.debited + total);
    const stillOwed = round2(n.total - n.paid - debited);
    await bill.update({
      debit_note_amount: debited,
      status: stillOwed <= EPS ? 'paid' : n.paid > 0 ? 'partial' : bill.status,
    }, { transaction: t });

    await t.commit();
    return getDebitNote(tenantId, note.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const getDebitNote = async (tenantId, id) => {
  const row = await db.SupplierDebitNote.findOne({ where: { id, tenant_id: tenantId }, include: includes() });
  if (!row) throw ApiError.notFound('Debit note not found');
  const o = row.get({ plain: true });
  const tenant = await db.Tenant.findByPk(tenantId, {
    attributes: ['id', 'name', 'company_name', 'email', 'phone', 'address', 'city', 'country', 'trn_number', 'vat_registration_number'],
  });
  o.party_name = (o.supplier && o.supplier.company_name) || (o.company && o.company.company_name) || '—';
  o.tenant = tenant ? tenant.get({ plain: true }) : null;
  return o;
};

const listDebitNotes = async (tenantId, filters = {}) => {
  const { offset, limit, search, supplierId, vendorBillId } = filters;
  const where = { tenant_id: tenantId };
  if (supplierId) where.supplier_id = supplierId;
  if (vendorBillId) where.vendor_bill_id = vendorBillId;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [{ debit_note_number: { [Op.like]: s } }, { reason: { [Op.like]: s } }, { '$supplier.company_name$': { [Op.like]: s } }];
  }
  const { count, rows } = await db.SupplierDebitNote.findAndCountAll({
    where,
    include: includes(),
    offset,
    limit,
    order: [['note_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
    subQuery: false,
  });
  return {
    debitNotes: rows.map((r) => {
      const o = r.get({ plain: true });
      o.party_name = (o.supplier && o.supplier.company_name) || (o.company && o.company.company_name) || '—';
      return o;
    }),
    total: count,
  };
};

module.exports = { REASONS, getBillDebitInfo, createDebitNote, getDebitNote, listDebitNotes };
