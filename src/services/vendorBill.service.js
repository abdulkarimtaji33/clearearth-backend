/**
 * Vendor bills — the step between a purchase order's accrual and the supplier payment.
 *
 *   PO approved      -> Dr expense head   / Cr 2200 Accrued Expenses        (postPoAccrual)
 *   Vendor bill      -> Dr 2200 Accrued   + Dr 1200 Input VAT / Cr 2000 AP  (createBill)
 *   Supplier payment -> Dr 2000 AP        / Cr the specific bank account    (payBills)
 *
 * Only POs approved after this flow shipped have bill_flow = 1. Older approved POs already
 * credited AP at approval and keep being paid per PO from the Payables screen.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const paymentTxService = require('./paymentTransaction.service');
const { isCashOrBank } = require('../utils/paymentAccount');

const EPS = 0.005;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

function poTotal(po) {
  return round2((po.items || []).reduce((s, it) => s + (parseFloat(it.total || 0) || 0), 0));
}

/** Dr expense head / Cr Accrued Expenses when a PO is approved. Marks the PO as bill-flow. */
async function postPoAccrual(tenantId, poId, total, entryDate, transaction = null) {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    attributes: ['id', 'expense_account_id'],
    transaction,
  });
  const expenseId = po?.expense_account_id || await jeService.getSystemAccountId(tenantId, '5000');
  const accruedId = await jeService.getSystemAccountId(tenantId, '2200');
  await jeService.createJournalEntry(tenantId, 1, {
    entryDate,
    description: `PO Approved — PO #${poId}`,
    sourceType: 'purchase_order_approved',
    sourceId: poId,
    lines: [
      { accountId: expenseId, debit: total, credit: 0 },
      { accountId: accruedId, debit: 0, credit: total },
    ],
  }, transaction);
  await db.PurchaseOrder.update({ bill_flow: true }, { where: { id: poId, tenant_id: tenantId }, transaction });
}

const billIncludes = [
  { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name', 'vat_number'], required: false },
  { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
  { model: db.PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'po_date', 'deal_id'], required: false },
];

const withBalance = (row) => {
  const o = row.get ? row.get({ plain: true }) : row;
  o.balance_due = Math.max(0, round2(parseFloat(o.total) - parseFloat(o.paid_amount || 0)));
  o.party_name = o.supplier?.company_name || o.company?.company_name || '—';
  return o;
};

/** Approved bill-flow POs that still have an unbilled accrual. */
const listAwaitingBill = async (tenantId) => {
  const pos = await db.PurchaseOrder.findAll({
    where: { tenant_id: tenantId, status: 'approved', bill_flow: true },
    include: [
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name', 'vat_number'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
      { model: db.PurchaseOrderItem, as: 'items', required: false },
    ],
    order: [['po_date', 'DESC'], ['id', 'DESC']],
  });
  const ids = pos.map((p) => p.id);
  const billed = ids.length
    ? await db.VendorBill.findAll({
      where: { tenant_id: tenantId, purchase_order_id: { [Op.in]: ids }, status: { [Op.ne]: 'void' } },
      attributes: ['purchase_order_id', [db.sequelize.fn('SUM', db.sequelize.col('subtotal')), 'billed']],
      group: ['purchase_order_id'],
      raw: true,
    })
    : [];
  const billedMap = Object.fromEntries(billed.map((b) => [b.purchase_order_id, parseFloat(b.billed) || 0]));

  return pos
    .map((p) => {
      const o = p.get({ plain: true });
      o.po_total = poTotal(o);
      o.billed_amount = round2(billedMap[o.id] || 0);
      o.unbilled_amount = round2(o.po_total - o.billed_amount);
      o.party_name = o.supplier?.company_name || o.company?.company_name || '—';
      return o;
    })
    .filter((o) => o.unbilled_amount > EPS);
};

const listBills = async (tenantId, filters = {}) => {
  const { offset, limit, search, status, supplierId, purchaseOrderId } = filters;
  const where = { tenant_id: tenantId };
  if (status === 'unpaid') where.status = { [Op.in]: ['open', 'partial'] };
  else if (status) where.status = status;
  if (supplierId) where.supplier_id = supplierId;
  if (purchaseOrderId) where.purchase_order_id = purchaseOrderId;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [
      { bill_number: { [Op.like]: s } },
      { supplier_invoice_no: { [Op.like]: s } },
      { '$supplier.company_name$': { [Op.like]: s } },
      { '$company.company_name$': { [Op.like]: s } },
    ];
  }
  const { count, rows } = await db.VendorBill.findAndCountAll({
    where,
    include: billIncludes,
    offset,
    limit,
    order: [['bill_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
    subQuery: false,
  });
  return { bills: rows.map(withBalance), total: count };
};

const getBill = async (tenantId, id) => {
  const row = await db.VendorBill.findOne({ where: { id, tenant_id: tenantId }, include: billIncludes });
  if (!row) throw ApiError.notFound('Vendor bill not found');
  return withBalance(row);
};

async function nextBillNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const [rows] = await db.sequelize.query(
    'SELECT bill_number FROM vendor_bills WHERE tenant_id = ? AND bill_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
    { replacements: [tenantId, `VB-${year}-%`], transaction }
  );
  let seq = 1;
  if (rows?.[0]?.bill_number) {
    const last = parseInt(String(rows[0].bill_number).split('-').pop(), 10);
    if (Number.isFinite(last)) seq = last + 1;
  }
  return `VB-${year}-${String(seq).padStart(4, '0')}`;
}

/** Record the supplier's invoice against a PO: clears the accrual, books Input VAT, creates AP. */
const createBill = async (tenantId, userId, body = {}) => {
  const {
    purchaseOrderId, supplierInvoiceNo, supplierTrn, billDate, dueDate, attachmentPath, notes,
  } = body;
  const subtotal = round2(body.subtotal);
  const vat = round2(body.vatAmount || 0);

  if (!purchaseOrderId) throw ApiError.badRequest('purchaseOrderId is required');
  if (!supplierInvoiceNo || !String(supplierInvoiceNo).trim()) throw ApiError.badRequest('Supplier invoice number is required');
  if (!billDate) throw ApiError.badRequest('Bill date is required');
  if (!(subtotal > EPS)) throw ApiError.badRequest('Amount (excluding VAT) must be greater than zero');
  if (vat < 0) throw ApiError.badRequest('VAT cannot be negative');

  const po = await db.PurchaseOrder.findOne({
    where: { id: purchaseOrderId, tenant_id: tenantId, status: 'approved' },
    include: [{ model: db.PurchaseOrderItem, as: 'items', required: false }],
  });
  if (!po) throw ApiError.notFound('Approved purchase order not found');
  if (!po.bill_flow) {
    throw ApiError.badRequest('This purchase order was approved before vendor bills were introduced and is paid directly from Payables');
  }

  const dup = await db.VendorBill.findOne({
    where: {
      tenant_id: tenantId,
      supplier_id: po.supplier_id,
      company_id: po.company_id,
      supplier_invoice_no: String(supplierInvoiceNo).trim(),
      status: { [Op.ne]: 'void' },
    },
  });
  if (dup) throw ApiError.conflict(`Supplier invoice ${supplierInvoiceNo} is already recorded (${dup.bill_number})`);

  const alreadyBilled = round2(await db.VendorBill.sum('subtotal', {
    where: { tenant_id: tenantId, purchase_order_id: po.id, status: { [Op.ne]: 'void' } },
  }) || 0);
  const unbilled = round2(poTotal(po) - alreadyBilled);
  if (subtotal > unbilled + 0.01) {
    throw ApiError.badRequest(`Bill amount exceeds the unbilled accrual on this PO (AED ${unbilled.toFixed(2)})`);
  }

  const total = round2(subtotal + vat);
  const accruedId = await jeService.getSystemAccountId(tenantId, '2200');
  const apId = await jeService.getSystemAccountId(tenantId, '2000');
  const inputVatId = vat > EPS ? await jeService.getSystemAccountId(tenantId, '1200') : null;

  const t = await db.sequelize.transaction();
  try {
    const billNumber = await nextBillNumber(tenantId, t);
    const bill = await db.VendorBill.create({
      tenant_id: tenantId,
      bill_number: billNumber,
      purchase_order_id: po.id,
      supplier_id: po.supplier_id || null,
      company_id: po.company_id || null,
      supplier_invoice_no: String(supplierInvoiceNo).trim(),
      supplier_trn: supplierTrn ? String(supplierTrn).trim() : null,
      bill_date: billDate,
      due_date: dueDate || null,
      subtotal,
      vat_amount: vat,
      total,
      paid_amount: 0,
      status: 'open',
      attachment_path: attachmentPath || null,
      notes: notes || null,
      created_by: userId || null,
    }, { transaction: t });

    const lines = [{ accountId: accruedId, debit: subtotal, credit: 0 }];
    if (inputVatId) lines.push({ accountId: inputVatId, debit: vat, credit: 0 });
    lines.push({ accountId: apId, debit: 0, credit: total });
    const entryId = await jeService.createJournalEntry(tenantId, userId || 1, {
      entryDate: billDate,
      description: `Vendor Bill ${billNumber} — Supplier invoice ${bill.supplier_invoice_no} (PO #${po.id})`,
      sourceType: 'vendor_bill',
      sourceId: bill.id,
      lines,
    }, t);
    await bill.update({ journal_entry_id: entryId }, { transaction: t });

    await t.commit();
    return getBill(tenantId, bill.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

/**
 * One supplier payment covering several bills of the same party:
 * Dr 2000 AP / Cr the chosen bank account. The bank account must be picked explicitly.
 */
const payBills = async (tenantId, userId, body = {}) => {
  const { allocations, paymentAccountId, paymentMethod, paymentDate, referenceNo, notes } = body;
  if (!Array.isArray(allocations) || allocations.length === 0) throw ApiError.badRequest('Select at least one bill to pay');
  if (!paymentAccountId) throw ApiError.badRequest('Select the bank / cash account the payment is made from');

  const bankAcc = await db.ChartOfAccounts.findOne({
    where: { id: paymentAccountId, tenant_id: tenantId, type: 'asset', is_group: false, is_active: true },
  });
  if (!bankAcc || !(await isCashOrBank(tenantId, bankAcc))) {
    throw ApiError.badRequest('Invalid payment account — choose an active cash or bank account');
  }

  const ids = allocations.map((a) => a.billId);
  if (new Set(ids).size !== ids.length) throw ApiError.badRequest('A bill can only appear once in a payment');
  const bills = await db.VendorBill.findAll({
    where: { tenant_id: tenantId, id: { [Op.in]: ids } },
    include: [
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    ],
  });
  if (bills.length !== ids.length) throw ApiError.notFound('One or more vendor bills were not found');
  const partyKey = (b) => `${b.supplier_id || ''}-${b.company_id || ''}`;
  if (new Set(bills.map(partyKey)).size > 1) throw ApiError.badRequest('All bills in one payment must belong to the same supplier');

  const byId = Object.fromEntries(bills.map((b) => [b.id, b]));
  const rows = allocations.map((a) => {
    const bill = byId[a.billId];
    const amount = round2(a.amount);
    const balance = round2(parseFloat(bill.total) - parseFloat(bill.paid_amount || 0));
    if (bill.status === 'void' || bill.status === 'paid') throw ApiError.badRequest(`${bill.bill_number} is not payable`);
    if (!(amount > EPS)) throw ApiError.badRequest(`Enter an amount for ${bill.bill_number}`);
    if (amount > balance + 0.01) throw ApiError.badRequest(`Amount for ${bill.bill_number} exceeds its balance (AED ${balance.toFixed(2)})`);
    return { bill, amount };
  });
  const totalPaid = round2(rows.reduce((s, r) => s + r.amount, 0));
  const payDate = paymentDate || new Date().toISOString().slice(0, 10);
  const paidTo = rows[0].bill.supplier?.company_name || rows[0].bill.company?.company_name || null;
  const apId = await jeService.getSystemAccountId(tenantId, '2000');

  const t = await db.sequelize.transaction();
  try {
    const entryId = await jeService.createJournalEntry(tenantId, userId || 1, {
      entryDate: payDate,
      description: `Supplier payment — ${rows.map((r) => r.bill.bill_number).join(', ')}`,
      sourceType: 'vendor_bill_payment',
      sourceId: rows[0].bill.id,
      paidTo,
      lines: [
        { accountId: apId, debit: totalPaid, credit: 0 },
        { accountId: bankAcc.id, debit: 0, credit: totalPaid },
      ],
    }, t);

    for (const { bill, amount } of rows) {
      await paymentTxService.createPaymentTransaction(tenantId, userId, {
        sourceType: 'vendor_bill',
        sourceId: bill.id,
        amount,
        paymentMethod,
        paymentAccountId: bankAcc.id,
        referenceNo,
        paidTo,
        notes,
        paidAt: payDate,
      }, t).then((tx) => tx.update({ journal_entry_id: entryId }, { transaction: t }));

      const paid = round2(parseFloat(bill.paid_amount || 0) + amount);
      const settled = paid >= parseFloat(bill.total) - 0.01;
      await bill.update({ paid_amount: paid, status: settled ? 'paid' : 'partial' }, { transaction: t });

      // Keep the PO's own payment summary in step for dashboards that still read it.
      const po = await db.PurchaseOrder.findOne({
        where: { id: bill.purchase_order_id, tenant_id: tenantId },
        include: [{ model: db.PurchaseOrderItem, as: 'items', required: false }],
        transaction: t,
      });
      if (po) {
        const poPaid = round2(parseFloat(po.paid_amount || 0) + amount);
        await po.update({
          paid_amount: poPaid,
          payment_status: poPaid >= poTotal(po) - 0.01 ? 'paid' : 'partial',
        }, { transaction: t });
      }
    }

    await t.commit();
    return { totalPaid, bills: await Promise.all(ids.map((id) => getBill(tenantId, id))) };
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

module.exports = { postPoAccrual, listAwaitingBill, listBills, getBill, createBill, payBills };
