/**
 * Ledger expenses (Accounts approval of work order task expense lines)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const paymentTxService = require('./paymentTransaction.service');
const { resolvePaymentAccount, resolveExpenseAccount, assertNotOverdrawn } = require('../utils/paymentAccount');
const expenseCategoryService = require('./expenseCategory.service');

const STATUSES = ['pending', 'approved', 'rejected'];

/** Ledger linkage for work-order–sourced expenses (not user-editable) */
const WO_EXPENSE_CATEGORY = 'work_orders';
const WO_EXPENSE_REFERENCE = 'work_order';
const MANUAL_EXPENSE_REFERENCE = 'manual';

const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

function deriveExpensePaymentStatus(amount, paidAmount) {
  const total = parseFloat(amount) || 0;
  const paid = parseFloat(paidAmount) || 0;
  if (total <= 0) return paid > 0 ? 'paid' : 'unpaid';
  if (paid <= 0) return 'unpaid';
  if (paid >= total - 0.005) return 'paid';
  return 'partial';
}

/** "Paid to" is an open field (a vendor, an employee, anyone); blank is allowed. */
async function normalizeVendorPayee(tenantId, paidTo) {
  const name = paidTo != null ? String(paidTo).trim() : '';
  return name ? name.slice(0, 255) : null;
}

async function loadTaskExpenseInWorkOrder(tenantId, workOrderId, taskExpenseId) {
  const te = await db.WorkOrderTaskExpense.findByPk(taskExpenseId, {
    include: [
      {
        model: db.WorkOrderTask,
        as: 'workOrderTask',
        required: true,
        include: [
          {
            model: db.WorkOrder,
            as: 'workOrder',
            required: true,
            where: { id: workOrderId, tenant_id: tenantId },
          },
        ],
      },
    ],
  });
  if (!te) throw ApiError.notFound('Task expense line not found');
  return te;
}

const approveTaskExpense = async (tenantId, userId, workOrderId, taskExpenseId, body) => {
  const {
    amount: amountOverride,
    expenseDate,
    paymentMethod,
    paidTo,
    notes,
    expenseAccountId,
  } = body;

  if (!expenseDate) {
    throw ApiError.badRequest('expenseDate is required');
  }
  // Debit the expense head the approver selects (e.g. 5410 Fuel, 5420 Vehicle Maintenance).
  // There is no silent fallback to the 5000 Cost of Services roll-up account.
  if (expenseAccountId == null || expenseAccountId === '') {
    throw ApiError.badRequest('Select the expense account (expense head) to debit for this work order expense');
  }
  // Period lock: fail loudly instead of saving the record and silently skipping its ledger entry.
  await jeService.assertPostingDateOpen(tenantId, expenseDate);
  const payee = await normalizeVendorPayee(tenantId, paidTo);

  const te = await loadTaskExpenseInWorkOrder(tenantId, workOrderId, taskExpenseId);

  if (te.accounts_status === 'approved') {
    throw ApiError.conflict('This expense line is already approved');
  }

  const amt = amountOverride != null && amountOverride !== ''
    ? parseFloat(amountOverride)
    : parseFloat(te.amount);
  if (!Number.isFinite(amt) || amt < 0) {
    throw ApiError.badRequest('Valid amount is required');
  }

  const existingLedger = await db.Expense.findOne({ where: { work_order_task_expense_id: taskExpenseId } });
  if (existingLedger) {
    throw ApiError.conflict('Ledger entry already exists for this line');
  }

  const expenseAccount = await resolveExpenseAccount(tenantId, { category: WO_EXPENSE_CATEGORY, expenseAccountId });

  await db.sequelize.transaction(async (t) => {
    const exp = await db.Expense.create(
      {
        tenant_id: tenantId,
        work_order_task_expense_id: taskExpenseId,
        category: WO_EXPENSE_CATEGORY,
        amount: amt,
        expense_date: expenseDate,
        paid_to: payee,
        payment_method: paymentMethod || null,
        notes: notes || null,
        reference: WO_EXPENSE_REFERENCE,
        reference_id: String(workOrderId),
        created_by: userId,
        payment_status: 'unpaid',
        paid_amount: null,
        paid_at: null,
        expense_account_id: expenseAccount.accountId,
      },
      { transaction: t }
    );

    await te.update(
      {
        accounts_status: 'approved',
        accounts_approved_at: new Date(),
        accounts_approved_by: userId,
      },
      { transaction: t }
    );

    // GL: Dr selected expense account / Cr Accrued Expenses (2200)
    try {
      const accruId = await jeService.getSystemAccountId(tenantId, '2200');
      await jeService.createJournalEntry(tenantId, userId, {
        entryDate: expenseDate,
        description: `Work Order Expense Approved — WO #${workOrderId}`,
        sourceType: 'expense',
        sourceId: exp.id,
        paidTo: exp.paid_to || null,
        lines: [
          { accountId: expenseAccount.accountId, debit: amt, credit: 0 },
          { accountId: accruId,                  debit: 0,   credit: amt },
        ],
      }, t);
    } catch (jeErr) {
      console.warn('[GL] expense (approve) journal entry skipped:', jeErr.message);
    }
  });

  const workOrderService = require('./workOrder.service');
  return workOrderService.getById(tenantId, workOrderId);
};

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

/**
 * Add Expense = a PAID expense. One entry: Dr expense sub-head (+ Dr 1200 Input VAT) / Cr the chosen
 * cash or bank account. Nothing goes through 2200. Unpaid expenses are entered as supplier bills.
 */
const createManualExpense = async (tenantId, userId, body) => {
  const {
    netAmount,
    amount,
    vatRate,
    expenseDate,
    paidTo,
    paymentMethod,
    notes,
    reference,
    referenceId,
    receiptNo,
    supplierTrn,
    attachmentPath,
    expenseAccountId,
    paymentAccountId,
    confirmNegative,
  } = body;

  if (!expenseDate) throw ApiError.badRequest('expenseDate is required');
  const net = round2(netAmount != null && netAmount !== '' ? netAmount : amount);
  if (!Number.isFinite(net) || net <= 0) throw ApiError.badRequest('Amount before VAT must be greater than zero');

  const rate = vatRate == null || vatRate === '' ? 0 : parseFloat(vatRate);
  if (![0, 5].includes(rate)) throw ApiError.badRequest('VAT must be 5% or none');
  const vat = round2((net * rate) / 100);
  const total = round2(net + vat);

  const receipt = receiptNo != null ? String(receiptNo).trim() : '';
  const trn = supplierTrn != null ? String(supplierTrn).trim() : '';
  if (vat > 0 && (!receipt || !trn)) {
    throw ApiError.badRequest('Recoverable VAT needs the supplier receipt / invoice number and the supplier TRN');
  }

  if (expenseAccountId == null || expenseAccountId === '') {
    throw ApiError.badRequest('Select the expense head and sub-head');
  }
  if (paymentAccountId == null || paymentAccountId === '') {
    throw ApiError.badRequest('Select the bank / cash account the expense is paid from');
  }

  // Period lock: fail loudly instead of saving the record and silently skipping its ledger entry.
  await jeService.assertPostingDateOpen(tenantId, expenseDate);

  // Only an active, postable expense account can be debited (groups are rejected), and only an
  // active cash/bank account can be credited.
  const expenseAccount = await resolveExpenseAccount(tenantId, { expenseAccountId });
  const payAcct = await resolvePaymentAccount(tenantId, { paymentMethod, paymentAccountId });
  await assertNotOverdrawn(tenantId, payAcct.accountId, total, confirmNegative);
  const payee = await normalizeVendorPayee(tenantId, paidTo);

  const acc = await db.ChartOfAccounts.findOne({ where: { id: expenseAccount.accountId, tenant_id: tenantId }, attributes: ['id', 'name', 'parent_id'] });
  const head = acc && acc.parent_id
    ? await db.ChartOfAccounts.findOne({ where: { id: acc.parent_id, tenant_id: tenantId }, attributes: ['name'] })
    : null;
  const category = String((head || acc || {}).name || 'expense')
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'expense';

  const ref = reference != null && String(reference).trim() !== '' ? String(reference).trim() : MANUAL_EXPENSE_REFERENCE;
  const refId = referenceId != null && String(referenceId).trim() !== '' ? String(referenceId).trim() : null;

  const t = await db.sequelize.transaction();
  let row;
  try {
    row = await db.Expense.create(
      {
        tenant_id: tenantId,
        work_order_task_expense_id: null,
        category,
        amount: total,
        net_amount: net,
        vat_amount: vat,
        vat_rate: rate,
        receipt_no: receipt || null,
        supplier_trn: trn || null,
        attachment_path: attachmentPath || null,
        expense_date: expenseDate,
        paid_to: payee,
        payment_method: paymentMethod || null,
        notes: notes || null,
        reference: ref,
        reference_id: refId,
        created_by: userId,
        payment_status: 'paid',
        paid_amount: total,
        paid_at: expenseDate,
        expense_account_id: expenseAccount.accountId,
      },
      { transaction: t }
    );

    const lines = [{ accountId: expenseAccount.accountId, debit: net, credit: 0 }];
    if (vat > 0.005) {
      lines.push({ accountId: await jeService.getSystemAccountId(tenantId, '1200'), debit: vat, credit: 0 });
    }
    lines.push({ accountId: payAcct.accountId, debit: 0, credit: total });

    const entryId = await jeService.createJournalEntry(tenantId, userId, {
      entryDate: expenseDate,
      description: `Expense — ${expenseAccount.accountCode} ${expenseAccount.accountName}${receipt ? ` (${receipt})` : ''}`,
      sourceType: 'expense',
      sourceId: row.id,
      paidTo: payee,
      lines,
    }, t);

    const paymentTx = await paymentTxService.createPaymentTransaction(tenantId, userId, {
      sourceType: 'expense',
      sourceId: row.id,
      amount: total,
      paymentMethod: paymentMethod || null,
      paymentAccountId: payAcct.accountId,
      paidTo: payee,
      paidAt: expenseDate,
    }, t);
    await paymentTx.update({ journal_entry_id: entryId }, { transaction: t });

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  return row;
};

const updateExpensePayment = async (tenantId, expenseId, body, userId = null) => {
  const exp = await db.Expense.findOne({ where: { id: expenseId, tenant_id: tenantId } });
  if (!exp) throw ApiError.notFound('Expense not found');

  const total = parseFloat(exp.amount) || 0;
  let paid = parseFloat(exp.paid_amount) || 0;

  if (body.amount != null && body.amount !== '') {
    const add = parseFloat(body.amount);
    if (!Number.isFinite(add) || add <= 0) throw ApiError.badRequest('amount must be a positive number');
    paid = Math.min(total, paid + add);
  }
  if (body.paidAmount != null && body.paidAmount !== '') {
    const set = parseFloat(body.paidAmount);
    if (!Number.isFinite(set) || set < 0) throw ApiError.badRequest('paidAmount must be valid');
    paid = Math.min(total, set);
  }

  const ps = deriveExpensePaymentStatus(total, paid);
  const paidAt = body.paidAt != null && String(body.paidAt).trim() !== '' ? String(body.paidAt).trim().slice(0, 10) : exp.paid_at;
  // Period lock: fail loudly instead of saving the record and silently skipping its ledger entry.
  await jeService.assertPostingDateOpen(tenantId, paidAt || new Date().toISOString().slice(0, 10));

  const prevPaid = parseFloat(exp.paid_amount) || 0;
  const delta    = Math.max(0, paid - prevPaid);

  const t = await db.sequelize.transaction();
  try {
    await exp.update(
      {
        paid_amount: paid > 0 ? paid : null,
        payment_status: ps,
        paid_at: ps === 'paid' ? (paidAt || exp.expense_date) : paid > 0 ? paidAt || exp.paid_at : null,
        payment_method: body.paymentMethod !== undefined ? body.paymentMethod || null : exp.payment_method,
      },
      { transaction: t }
    );

    // GL: Dr Accrued Expenses (2200) / Cr payment account — only for incremental payment
    if (delta > 0.005) {
      const payAcct = await resolvePaymentAccount(tenantId, {
        paymentMethod: body.paymentMethod ?? exp.payment_method,
        paymentAccountId: body.paymentAccountId,
      });
      await assertNotOverdrawn(tenantId, payAcct.accountId, delta, body.confirmNegative);

      const paymentTx = await paymentTxService.createPaymentTransaction(tenantId, userId || exp.created_by || 1, {
        sourceType: 'expense',
        sourceId: exp.id,
        amount: delta,
        paymentMethod: body.paymentMethod ?? exp.payment_method,
        paymentAccountId: payAcct.accountId,
        paidTo: exp.paid_to || null,
        paidAt: paidAt || new Date().toISOString().slice(0, 10),
      }, t);

      try {
        const accruId = await jeService.getSystemAccountId(tenantId, '2200');
        const entryId = await jeService.createJournalEntry(tenantId, exp.created_by || 1, {
          entryDate: paidAt || new Date().toISOString().slice(0, 10),
          description: `Expense Payment — ${exp.category}`,
          sourceType: 'expense_payment',
          sourceId: exp.id,
          paidTo: exp.paid_to || null,
          lines: [
            { accountId: accruId, debit: delta, credit: 0 },
            { accountId: payAcct.accountId, debit: 0, credit: delta },
          ],
        }, t);
        await paymentTx.update({ journal_entry_id: entryId }, { transaction: t });
      } catch (jeErr) {
        console.warn('[GL] expense_payment journal entry skipped:', jeErr.message);
      }
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  return exp.reload({
    include: [
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      {
        model: db.WorkOrderTaskExpense,
        as: 'taskExpense',
        required: false,
        attributes: ['id', 'description', 'amount'],
      },
    ],
  });
};

const listLedgerExpenses = async (tenantId, filters = {}) => {
  const { offset, limit, search, dateFrom, dateTo, category, paymentStatus, expenseHeadId, expenseAccountId } = filters;
  const where = { tenant_id: tenantId };
  applyDateOnlyColumnFilter(where, 'expense_date', dateFrom, dateTo);
  if (expenseAccountId) {
    where.expense_account_id = parseInt(expenseAccountId, 10);
  } else if (expenseHeadId) {
    // A head matches itself and every sub-head under it.
    const headId = parseInt(expenseHeadId, 10);
    const kids = await db.ChartOfAccounts.findAll({ where: { tenant_id: tenantId, parent_id: headId }, attributes: ['id'] });
    where.expense_account_id = { [Op.in]: [headId, ...kids.map((k) => k.id)] };
  }
  if (category && String(category).trim() !== '') {
    where.category = String(category).trim();
  }
  if (paymentStatus && String(paymentStatus).trim() !== '') {
    where.payment_status = String(paymentStatus).trim().toLowerCase();
  }
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [
      { category: { [Op.like]: s } },
      { paid_to: { [Op.like]: s } },
      { reference: { [Op.like]: s } },
      { notes: { [Op.like]: s } },
      { payment_method: { [Op.like]: s } },
    ];
  }

  const include = [
    { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    { model: db.ChartOfAccounts, as: 'expenseAccount', attributes: ['id', 'code', 'name', 'parent_id'], required: false },
    {
      model: db.WorkOrderTaskExpense,
      as: 'taskExpense',
      required: false,
      attributes: ['id', 'description', 'amount'],
      include: [
        {
          model: db.WorkOrderTask,
          as: 'workOrderTask',
          required: false,
          attributes: ['id', 'type_of_work'],
          include: [
            {
              model: db.WorkOrder,
              as: 'workOrder',
              required: false,
              attributes: ['id', 'title', 'deal_id'],
              include: [
                { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
              ],
            },
          ],
        },
      ],
    },
  ];

  const total = await db.Expense.count({ where });
  const rows = await db.Expense.findAll({
    where,
    include,
    offset,
    limit,
    order: [
      ['expense_date', 'DESC'],
      ['id', 'DESC'],
    ],
    subQuery: false,
  });

  return { expenses: rows, total };
};

const rejectTaskExpense = async (tenantId, workOrderId, taskExpenseId, reason) => {
  const te = await loadTaskExpenseInWorkOrder(tenantId, workOrderId, taskExpenseId);

  if (te.accounts_status === 'approved') {
    throw ApiError.badRequest('Cannot reject an approved expense; reverse in ledger separately');
  }

  await te.update({
    accounts_status: 'rejected',
    accounts_approved_at: null,
    accounts_approved_by: null,
    rejection_reason: reason != null && String(reason).trim() !== '' ? String(reason).trim() : null,
  });

  const workOrderService = require('./workOrder.service');
  return workOrderService.getById(tenantId, workOrderId);
};

const listExpensePayments = async (tenantId, expenseId) => {
  const exp = await db.Expense.findOne({ where: { id: expenseId, tenant_id: tenantId } });
  if (!exp) throw ApiError.notFound('Expense not found');
  return paymentTxService.listPaymentTransactions(tenantId, 'expense', expenseId);
};

module.exports = {
  approveTaskExpense,
  rejectTaskExpense,
  createManualExpense,
  updateExpensePayment,
  listExpensePayments,
  listLedgerExpenses,
  STATUSES,
  PAYMENT_STATUSES,
};
