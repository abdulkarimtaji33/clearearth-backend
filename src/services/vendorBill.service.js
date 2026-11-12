/**
 * Vendor bills — what the supplier invoiced, payable under the supplier's name.
 *
 *   PO approved         -> posts nothing; it only records the expense head / sub-head
 *   Supplier bill       -> Dr expense head + Dr 1200 Input VAT / Cr 2000 Accounts Payable   (createBill / createDirectBill)
 *   Work order expense  -> approval accrues Dr expense / Cr 2200; the supplier bill then clears it:
 *                          Dr 2200 (+ Dr 1200) / Cr 2000                                      (createWorkOrderExpenseBill)
 *   Supplier payment    -> Dr 2000 / Cr the chosen bank or cash account                        (payBills)
 *
 * 2200 Accrued Expenses is used for work orders only. POs approved before this change (bill_flow = 1
 * with an accrual journal) have that accrual cleared first when their bill is recorded.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const paymentTxService = require('./paymentTransaction.service');
const { isCashOrBank, resolveExpenseAccount, assertNotOverdrawn } = require('../utils/paymentAccount');
const { resolveVat } = require('../utils/vat');

const EPS = 0.005;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

function poTotal(po) {
  return round2((po.items || []).reduce((s, it) => s + (parseFloat(it.total || 0) || 0), 0));
}

/** The PO must carry an active expense head / sub-head (posting account) before it can be approved. */
async function assertPoHead(tenantId, expenseAccountId) {
  if (expenseAccountId == null || expenseAccountId === '') {
    throw ApiError.badRequest('Select the expense head and sub-head on the purchase order before approving it');
  }
  return resolveExpenseAccount(tenantId, { expenseAccountId });
}

/** PO approval posts nothing: it only checks the head and sends the PO to "Awaiting bill". */
async function approvePoForBilling(tenantId, poId, transaction = null) {
  const po = await db.PurchaseOrder.findOne({ where: { id: poId, tenant_id: tenantId }, attributes: ['id', 'expense_account_id'], transaction });
  if (!po) throw ApiError.notFound('Purchase order not found');
  await assertPoHead(tenantId, po.expense_account_id);
  await db.PurchaseOrder.update({ bill_flow: true }, { where: { id: poId, tenant_id: tenantId }, transaction });
}

/** LEGACY (kept only for scripts/fix-legacy-po-accruals.js): Dr expense head / Cr Accrued Expenses. */
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
  { model: db.ChartOfAccounts, as: 'expenseAccount', attributes: ['id', 'code', 'name'], required: false },
];

const withBalance = (row) => {
  const o = row.get ? row.get({ plain: true }) : row;
  o.balance_due = Math.max(0, round2(parseFloat(o.total) - parseFloat(o.paid_amount || 0) - parseFloat(o.debit_note_amount || 0)));
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

/**
 * Record the supplier's invoice against an approved PO:
 *   Dr expense head (+ Dr 1200 Input VAT) / Cr 2000 Accounts Payable, under the supplier.
 * A bill above what is left on the PO needs the extra amount approved; the difference is posted to the expense head.
 * POs approved before this change that already carry an accrual (Cr 2200) have it cleared first (Dr 2200).
 */
const createBill = async (tenantId, userId, body = {}) => {
  const {
    purchaseOrderId, supplierInvoiceNo, supplierTrn, billDate, dueDate, attachmentPath, notes, expenseAccountId, approveOverage,
  } = body;
  const subtotal = round2(body.subtotal);
  const vat = round2(body.vatAmount || 0);

  if (!purchaseOrderId) throw ApiError.badRequest('purchaseOrderId is required');
  if (!supplierInvoiceNo || !String(supplierInvoiceNo).trim()) throw ApiError.badRequest('Supplier invoice number is required');
  if (!billDate) throw ApiError.badRequest('Bill date is required');
  if (!(subtotal > EPS)) throw ApiError.badRequest('Amount (excluding VAT) must be greater than zero');
  if (vat < 0) throw ApiError.badRequest('VAT cannot be negative');
  if (dueDate && String(dueDate).slice(0, 10) < String(billDate).slice(0, 10)) {
    throw ApiError.badRequest('The due date cannot be before the bill date');
  }
  await jeService.assertPostingDateOpen(tenantId, billDate);

  const po = await db.PurchaseOrder.findOne({
    where: { id: purchaseOrderId, tenant_id: tenantId, status: 'approved' },
    include: [
      { model: db.PurchaseOrderItem, as: 'items', required: false },
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    ],
  });
  if (!po) throw ApiError.notFound('Approved purchase order not found');
  if (!po.bill_flow) {
    throw ApiError.badRequest('This purchase order was approved before vendor bills were introduced and is paid directly from Payables');
  }
  const partyName = (po.supplier && po.supplier.company_name) || (po.company && po.company.company_name) || null;

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

  // The head comes from the PO and can be changed on the bill; it is mandatory either way.
  const headAcc = await assertPoHead(tenantId, expenseAccountId || po.expense_account_id);

  const alreadyBilled = round2(await db.VendorBill.sum('subtotal', {
    where: { tenant_id: tenantId, purchase_order_id: po.id, status: { [Op.ne]: 'void' } },
  }) || 0);
  const unbilled = round2(poTotal(po) - alreadyBilled);
  const overage = round2(Math.max(0, subtotal - unbilled));
  if (overage > 0.01 && !(approveOverage === true || approveOverage === 'true')) {
    throw ApiError.badRequest(
      `The bill is AED ${overage.toFixed(2)} above what is left on the PO (AED ${Math.max(unbilled, 0).toFixed(2)}). Approve the extra amount to post the difference to the expense head.`
    );
  }

  // Old accrual (POs approved before PO approval stopped posting): clear it first.
  const accrued = await db.JournalEntry.findOne({
    where: { tenant_id: tenantId, source_type: 'purchase_order_approved', source_id: po.id, status: 'posted', reversed_by_id: null },
  });
  const accrualPart = accrued ? round2(Math.min(subtotal, Math.max(unbilled, 0))) : 0;
  const headPart = round2(subtotal - accrualPart);

  const total = round2(subtotal + vat);
  const apId = await jeService.getSystemAccountId(tenantId, '2000');
  const accruedId = accrualPart > EPS ? await jeService.getSystemAccountId(tenantId, '2200') : null;
  const inputVatId = vat > EPS ? await jeService.getSystemAccountId(tenantId, '1200') : null;

  const t = await db.sequelize.transaction();
  try {
    const billNumber = await nextBillNumber(tenantId, t);
    const bill = await db.VendorBill.create({
      tenant_id: tenantId,
      bill_number: billNumber,
      purchase_order_id: po.id,
      expense_account_id: headAcc.accountId,
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

    const lines = [];
    if (accruedId) lines.push({ accountId: accruedId, debit: accrualPart, credit: 0 });
    if (headPart > EPS) lines.push({ accountId: headAcc.accountId, debit: headPart, credit: 0 });
    if (inputVatId) lines.push({ accountId: inputVatId, debit: vat, credit: 0 });
    lines.push({ accountId: apId, debit: 0, credit: total, description: partyName ? `Supplier: ${partyName}` : undefined });
    const entryId = await jeService.createJournalEntry(tenantId, userId || 1, {
      entryDate: billDate,
      description: `Vendor Bill ${billNumber} — Supplier invoice ${bill.supplier_invoice_no} (PO #${po.id})`,
      sourceType: 'vendor_bill',
      sourceId: bill.id,
      paidTo: partyName,
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

/** Approved work order expenses still on the accrual (Cr 2200) that have no supplier bill yet. */
const listAwaitingWoExpenses = async (tenantId) => {
  const billed = await db.VendorBill.findAll({
    where: { tenant_id: tenantId, expense_id: { [Op.ne]: null }, status: { [Op.ne]: 'void' } },
    attributes: ['expense_id'],
    raw: true,
  });
  const billedIds = billed.map((b) => b.expense_id);
  const rows = await db.Expense.findAll({
    where: {
      tenant_id: tenantId,
      payment_status: 'unpaid',
      work_order_task_expense_id: { [Op.ne]: null },
      id: { [Op.notIn]: billedIds.length ? billedIds : [0] },
    },
    include: [
      { model: db.ChartOfAccounts, as: 'expenseAccount', attributes: ['id', 'code', 'name'], required: false },
      {
        model: db.WorkOrderTaskExpense,
        as: 'taskExpense',
        required: false,
        attributes: ['id', 'description'],
        include: [{
          model: db.WorkOrderTask,
          as: 'workOrderTask',
          required: false,
          attributes: ['id'],
          include: [{ model: db.WorkOrder, as: 'workOrder', required: false, attributes: ['id', 'title'] }],
        }],
      },
    ],
    order: [['expense_date', 'DESC'], ['id', 'DESC']],
  });
  return rows.map((r) => {
    const o = r.get({ plain: true });
    o.work_order = o.taskExpense?.workOrderTask?.workOrder || null;
    o.description = o.taskExpense?.description || o.notes || '';
    return o;
  });
};

/** Supplier bill that clears a work order expense accrual: Dr 2200 (+ Dr 1200 Input VAT) / Cr 2000. */
const createWorkOrderExpenseBill = async (tenantId, userId, body = {}) => {
  const { supplierId, workOrderExpenseId, supplierInvoiceNo, supplierTrn, billDate, dueDate, attachmentPath, notes } = body;
  if (!supplierId) throw ApiError.badRequest('Select the supplier');
  if (!workOrderExpenseId) throw ApiError.badRequest('Select the work order expense');
  if (!supplierInvoiceNo || !String(supplierInvoiceNo).trim()) throw ApiError.badRequest('Supplier invoice number is required');
  if (!billDate) throw ApiError.badRequest('Bill date is required');
  if (dueDate && String(dueDate).slice(0, 10) < String(billDate).slice(0, 10)) throw ApiError.badRequest('The due date cannot be before the bill date');
  await jeService.assertPostingDateOpen(tenantId, billDate);

  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId }, attributes: ['id', 'company_name'] });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  const exp = await db.Expense.findOne({
    where: { id: workOrderExpenseId, tenant_id: tenantId, payment_status: 'unpaid', work_order_task_expense_id: { [Op.ne]: null } },
  });
  if (!exp) throw ApiError.notFound('Work order expense not found, or it is already paid');
  const already = await db.VendorBill.findOne({ where: { tenant_id: tenantId, expense_id: exp.id, status: { [Op.ne]: 'void' } } });
  if (already) throw ApiError.conflict(`This work order expense is already billed (${already.bill_number})`);

  const net = round2(exp.amount);
  const { vat } = resolveVat(net, body.vatRate, body.vatAmount);
  const trn = supplierTrn ? String(supplierTrn).trim() : '';
  if (vat > EPS && !trn) throw ApiError.badRequest('Recoverable VAT needs the supplier TRN');
  const invNo = String(supplierInvoiceNo).trim();
  const dup = await db.VendorBill.findOne({ where: { tenant_id: tenantId, supplier_id: supplier.id, supplier_invoice_no: invNo, status: { [Op.ne]: 'void' } } });
  if (dup) throw ApiError.conflict(`Supplier invoice ${invNo} is already recorded (${dup.bill_number})`);

  const total = round2(net + vat);
  const accruedId = await jeService.getSystemAccountId(tenantId, '2200');
  const apId = await jeService.getSystemAccountId(tenantId, '2000');
  const inputVatId = vat > EPS ? await jeService.getSystemAccountId(tenantId, '1200') : null;

  const t = await db.sequelize.transaction();
  try {
    const billNumber = await nextBillNumber(tenantId, t);
    const bill = await db.VendorBill.create({
      tenant_id: tenantId,
      bill_number: billNumber,
      purchase_order_id: null,
      expense_id: exp.id,
      expense_account_id: exp.expense_account_id || null,
      supplier_id: supplier.id,
      supplier_invoice_no: invNo,
      supplier_trn: trn || null,
      bill_date: billDate,
      due_date: dueDate || null,
      subtotal: net,
      vat_amount: vat,
      total,
      paid_amount: 0,
      status: 'open',
      attachment_path: attachmentPath || null,
      notes: notes || null,
      created_by: userId || null,
    }, { transaction: t });

    const lines = [{ accountId: accruedId, debit: net, credit: 0 }];
    if (inputVatId) lines.push({ accountId: inputVatId, debit: vat, credit: 0 });
    lines.push({ accountId: apId, debit: 0, credit: total, description: `Supplier: ${supplier.company_name}` });
    const entryId = await jeService.createJournalEntry(tenantId, userId || 1, {
      entryDate: billDate,
      description: `Supplier Bill ${billNumber} — ${supplier.company_name} (invoice ${invNo}) clears work order expense #${exp.id}`,
      sourceType: 'vendor_bill',
      sourceId: bill.id,
      paidTo: supplier.company_name,
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
 * Supplier bill entered WITHOUT a purchase order (an unpaid expense):
 *   Dr expense account (+ Dr 1200 Input VAT) / Cr 2000 Accounts Payable, payable under the supplier's name.
 * It is paid later like any other bill (Dr 2000 / Cr the chosen bank or cash account).
 */
const createDirectBill = async (tenantId, userId, body = {}) => {
  const { supplierId, supplierInvoiceNo, supplierTrn, billDate, dueDate, attachmentPath, notes, expenseAccountId } = body;
  const net = round2(body.netAmount);

  if (!supplierId) throw ApiError.badRequest('Select the supplier');
  if (!supplierInvoiceNo || !String(supplierInvoiceNo).trim()) throw ApiError.badRequest('Supplier invoice number is required');
  if (!billDate) throw ApiError.badRequest('Bill date is required');
  if (!expenseAccountId) throw ApiError.badRequest('Select the expense head and sub-head');
  if (!(net > EPS)) throw ApiError.badRequest('Amount before VAT must be greater than zero');
  if (dueDate && String(dueDate).slice(0, 10) < String(billDate).slice(0, 10)) {
    throw ApiError.badRequest('The due date cannot be before the bill date');
  }
  const { vat } = resolveVat(net, body.vatRate, body.vatAmount);
  const trn = supplierTrn ? String(supplierTrn).trim() : '';
  if (vat > EPS && !trn) throw ApiError.badRequest('Recoverable VAT needs the supplier TRN');

  // Period lock first: nothing is saved if the month is closed.
  await jeService.assertPostingDateOpen(tenantId, billDate);

  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId }, attributes: ['id', 'company_name'] });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  const expenseAcc = await resolveExpenseAccount(tenantId, { expenseAccountId });

  const invNo = String(supplierInvoiceNo).trim();
  const dup = await db.VendorBill.findOne({
    where: { tenant_id: tenantId, supplier_id: supplier.id, supplier_invoice_no: invNo, status: { [Op.ne]: 'void' } },
  });
  if (dup) throw ApiError.conflict(`Supplier invoice ${invNo} is already recorded (${dup.bill_number})`);

  const total = round2(net + vat);
  const apId = await jeService.getSystemAccountId(tenantId, '2000');
  const inputVatId = vat > EPS ? await jeService.getSystemAccountId(tenantId, '1200') : null;

  const t = await db.sequelize.transaction();
  try {
    const billNumber = await nextBillNumber(tenantId, t);
    const bill = await db.VendorBill.create({
      tenant_id: tenantId,
      bill_number: billNumber,
      purchase_order_id: null,
      expense_account_id: expenseAcc.accountId,
      supplier_id: supplier.id,
      company_id: null,
      supplier_invoice_no: invNo,
      supplier_trn: trn || null,
      bill_date: billDate,
      due_date: dueDate || null,
      subtotal: net,
      vat_amount: vat,
      total,
      paid_amount: 0,
      status: 'open',
      attachment_path: attachmentPath || null,
      notes: notes || null,
      created_by: userId || null,
    }, { transaction: t });

    const lines = [{ accountId: expenseAcc.accountId, debit: net, credit: 0 }];
    if (inputVatId) lines.push({ accountId: inputVatId, debit: vat, credit: 0 });
    lines.push({ accountId: apId, debit: 0, credit: total, description: `Supplier: ${supplier.company_name}` });
    const entryId = await jeService.createJournalEntry(tenantId, userId || 1, {
      entryDate: billDate,
      description: `Supplier Bill ${billNumber} — ${supplier.company_name} (invoice ${invNo})`,
      sourceType: 'vendor_bill',
      sourceId: bill.id,
      paidTo: supplier.company_name,
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
  const { allocations, paymentAccountId, paymentMethod, paymentDate, referenceNo, notes, confirmNegative } = body;
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
    const balance = round2(parseFloat(bill.total) - parseFloat(bill.paid_amount || 0) - parseFloat(bill.debit_note_amount || 0));
    if (bill.status === 'void' || bill.status === 'paid') throw ApiError.badRequest(`${bill.bill_number} is not payable`);
    if (!(amount > EPS)) throw ApiError.badRequest(`Enter an amount for ${bill.bill_number}`);
    if (amount > balance + 0.01) throw ApiError.badRequest(`Amount for ${bill.bill_number} exceeds its balance (AED ${balance.toFixed(2)})`);
    return { bill, amount };
  });
  const totalPaid = round2(rows.reduce((s, r) => s + r.amount, 0));
  await assertNotOverdrawn(tenantId, bankAcc.id, totalPaid, confirmNegative);
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
      const settled = paid + parseFloat(bill.debit_note_amount || 0) >= parseFloat(bill.total) - 0.01;
      await bill.update({ paid_amount: paid, status: settled ? 'paid' : 'partial' }, { transaction: t });
      if (settled && bill.expense_id) {
        await db.Expense.update(
          { payment_status: 'paid', paid_amount: round2(bill.subtotal), paid_at: payDate },
          { where: { id: bill.expense_id, tenant_id: tenantId }, transaction: t }
        );
      }

      // Keep the PO's own payment summary in step for dashboards that still read it.
      const po = bill.purchase_order_id == null ? null : await db.PurchaseOrder.findOne({
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

module.exports = {
  postPoAccrual, approvePoForBilling, assertPoHead, listAwaitingBill, listAwaitingWoExpenses, listBills, getBill,
  createBill, createDirectBill, createWorkOrderExpenseBill, payBills,
};
