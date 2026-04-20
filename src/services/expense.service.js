/**
 * Ledger expenses (Accounts approval of work order task expense lines)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const STATUSES = ['pending', 'approved', 'rejected'];

/** Ledger linkage for work-order–sourced expenses (not user-editable) */
const WO_EXPENSE_CATEGORY = 'work_orders';
const WO_EXPENSE_PAID_TO = 'Operations';
const WO_EXPENSE_REFERENCE = 'work_order';
const MANUAL_EXPENSE_REFERENCE = 'manual';

const MANUAL_CATEGORIES = [
  'travel',
  'utility',
  'fuel',
  'materials',
  'equipment',
  'professional',
  'other',
];

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
    notes,
  } = body;

  if (!expenseDate) {
    throw ApiError.badRequest('expenseDate is required');
  }

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

  await db.sequelize.transaction(async (t) => {
    const exp = await db.Expense.create(
      {
        tenant_id: tenantId,
        work_order_task_expense_id: taskExpenseId,
        category: WO_EXPENSE_CATEGORY,
        amount: amt,
        expense_date: expenseDate,
        paid_to: WO_EXPENSE_PAID_TO,
        payment_method: paymentMethod || null,
        notes: notes || null,
        reference: WO_EXPENSE_REFERENCE,
        reference_id: String(workOrderId),
        created_by: userId,
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
  });

  const workOrderService = require('./workOrder.service');
  return workOrderService.getById(tenantId, workOrderId);
};

const createManualExpense = async (tenantId, userId, body) => {
  const {
    category,
    amount,
    expenseDate,
    paidTo,
    paymentMethod,
    notes,
    reference,
    referenceId,
  } = body;

  const cat = category != null ? String(category).trim().toLowerCase() : '';
  if (!cat || !MANUAL_CATEGORIES.includes(cat)) {
    throw ApiError.badRequest(`category must be one of: ${MANUAL_CATEGORIES.join(', ')}`);
  }
  if (!expenseDate) throw ApiError.badRequest('expenseDate is required');
  const amt = parseFloat(amount);
  if (!Number.isFinite(amt) || amt < 0) throw ApiError.badRequest('Valid amount is required');

  const ref = reference != null && String(reference).trim() !== '' ? String(reference).trim() : MANUAL_EXPENSE_REFERENCE;
  const refId = referenceId != null && String(referenceId).trim() !== '' ? String(referenceId).trim() : null;

  const row = await db.Expense.create({
    tenant_id: tenantId,
    work_order_task_expense_id: null,
    category: cat,
    amount: amt,
    expense_date: expenseDate,
    paid_to: paidTo != null && String(paidTo).trim() !== '' ? String(paidTo).trim() : null,
    payment_method: paymentMethod || null,
    notes: notes || null,
    reference: ref,
    reference_id: refId,
    created_by: userId,
  });

  return row;
};

const listLedgerExpenses = async (tenantId, filters = {}) => {
  const { offset, limit, search, dateFrom, dateTo, category } = filters;
  const where = { tenant_id: tenantId };
  applyDateOnlyColumnFilter(where, 'expense_date', dateFrom, dateTo);
  if (category && String(category).trim() !== '') {
    where.category = String(category).trim();
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

const rejectTaskExpense = async (tenantId, workOrderId, taskExpenseId) => {
  const te = await loadTaskExpenseInWorkOrder(tenantId, workOrderId, taskExpenseId);

  if (te.accounts_status === 'approved') {
    throw ApiError.badRequest('Cannot reject an approved expense; reverse in ledger separately');
  }

  await te.update({
    accounts_status: 'rejected',
    accounts_approved_at: null,
    accounts_approved_by: null,
  });

  const workOrderService = require('./workOrder.service');
  return workOrderService.getById(tenantId, workOrderId);
};

module.exports = {
  approveTaskExpense,
  rejectTaskExpense,
  createManualExpense,
  listLedgerExpenses,
  STATUSES,
};
