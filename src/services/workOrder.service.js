/**
 * Work Order Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const purchaseOrderService = require('./purchaseOrder.service');
const grnService = require('./grn.service');

const taskInclude = {
  model: db.WorkOrderTask,
  as: 'tasks',
  separate: true,
  order: [['sort_order', 'ASC'], ['id', 'ASC']],
  include: [
    { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    { model: db.WorkType, as: 'workType', attributes: ['id', 'name'], required: false },
    {
      model: db.WorkOrderTaskExpense,
      as: 'expenses',
      required: false,
      separate: true,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      include: [
        { model: db.Expense, as: 'ledgerExpense', required: false, attributes: ['id', 'category', 'amount', 'expense_date', 'reference'] },
      ],
    },
  ],
};

const buildExpenseLines = (task) => {
  const lines = [];
  if (Array.isArray(task.expenses) && task.expenses.length > 0) {
    task.expenses.forEach((ex, i) => {
      const amt = ex.amount != null ? parseFloat(ex.amount) : NaN;
      if (!Number.isFinite(amt) || amt < 0) return;
      lines.push({
        description: ex.description != null && String(ex.description).trim() !== '' ? String(ex.description).trim() : null,
        amount: amt,
        sort_order: i,
        evidence_path: ex.evidencePath || ex.evidence_path || null,
        evidence_file_name: ex.evidenceFileName || ex.evidence_file_name || null,
      });
    });
  } else if (task.expense != null && task.expense !== '') {
    const v = parseFloat(task.expense);
    if (Number.isFinite(v) && v >= 0) {
      lines.push({ description: null, amount: v, sort_order: 0 });
    }
  }
  const sum = lines.length > 0 ? lines.reduce((s, e) => s + e.amount, 0) : null;
  return { expenseLines: lines, expenseTotal: sum };
};

const resolveTaskPayload = async (tenantId, task, transaction) => {
  let typeOfWork = task.typeOfWork != null && task.typeOfWork !== '' ? String(task.typeOfWork).trim() : null;
  let workTypeId = task.workTypeId != null ? parseInt(task.workTypeId, 10) : null;
  if (Number.isFinite(workTypeId)) {
    const wt = await db.WorkType.findOne({ where: { id: workTypeId, tenant_id: tenantId }, transaction });
    if (!wt) throw ApiError.badRequest('Work type not found');
    typeOfWork = wt.name;
  } else {
    workTypeId = null;
  }

  let assignedTo = task.assignedTo != null && task.assignedTo !== '' ? parseInt(task.assignedTo, 10) : null;
  if (assignedTo != null) {
    if (!Number.isFinite(assignedTo)) {
      assignedTo = null;
    } else {
      const user = await db.User.findOne({
        where: { id: assignedTo, tenant_id: tenantId, status: 'active' },
        transaction,
      });
      if (!user) throw ApiError.badRequest('Assigned user not found');
    }
  }

  const status = task.status || 'not_started';
  const { expenseLines, expenseTotal } = buildExpenseLines(task);
  return {
    payload: {
      type_of_work: typeOfWork,
      work_type_id: workTypeId,
      expense: expenseTotal,
      estimated_duration: task.estimatedDuration || null,
      start_date: task.startDate || null,
      end_date: task.endDate || null,
      assigned_to: assignedTo,
      status,
      notes: task.notes || null,
    },
    expenseLines,
  };
};

const syncTaskExpenses = async (taskId, expenseLines, transaction) => {
  const existing = await db.WorkOrderTaskExpense.findAll({
    where: { work_order_task_id: taskId },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    transaction,
  });
  const existingIds = existing.map((e) => e.id);
  const ledgerRows = existingIds.length
    ? await db.Expense.findAll({
      where: { work_order_task_expense_id: { [Op.in]: existingIds } },
      attributes: ['work_order_task_expense_id'],
      transaction,
    })
    : [];
  const linkedIds = new Set(ledgerRows.map((r) => r.work_order_task_expense_id));

  if (linkedIds.size > 0) {
    for (let i = 0; i < expenseLines.length; i += 1) {
      const line = expenseLines[i];
      const row = existing[i];
      if (row) {
        await row.update({
          description: line.description,
          amount: line.amount,
          sort_order: line.sort_order ?? i,
          evidence_path: line.evidence_path ?? row.evidence_path,
          evidence_file_name: line.evidence_file_name ?? row.evidence_file_name,
        }, { transaction });
      } else {
        await db.WorkOrderTaskExpense.create({
          work_order_task_id: taskId,
          description: line.description,
          amount: line.amount,
          sort_order: line.sort_order ?? i,
          evidence_path: line.evidence_path || null,
          evidence_file_name: line.evidence_file_name || null,
        }, { transaction });
      }
    }
    return;
  }

  await db.WorkOrderTaskExpense.destroy({ where: { work_order_task_id: taskId }, transaction });
  if (expenseLines.length > 0) {
    await db.WorkOrderTaskExpense.bulkCreate(
      expenseLines.map((line) => ({
        work_order_task_id: taskId,
        description: line.description,
        amount: line.amount,
        sort_order: line.sort_order,
        evidence_path: line.evidence_path || null,
        evidence_file_name: line.evidence_file_name || null,
      })),
      { transaction }
    );
  }
};

const safeDeleteTask = async (taskId, transaction) => {
  const expenseRows = await db.WorkOrderTaskExpense.findAll({
    where: { work_order_task_id: taskId },
    attributes: ['id'],
    transaction,
  });
  const expenseIds = expenseRows.map((e) => e.id);
  if (expenseIds.length) {
    const ledgerCount = await db.Expense.count({
      where: { work_order_task_expense_id: { [Op.in]: expenseIds } },
      transaction,
    });
    if (ledgerCount > 0) {
      throw ApiError.badRequest('Cannot remove a task that has linked accounting expenses');
    }
    await db.WorkOrderTaskExpense.destroy({ where: { work_order_task_id: taskId }, transaction });
  }
  await db.WorkOrderTask.destroy({ where: { id: taskId }, transaction });
};

const updateTaskInPlace = async (tenantId, taskId, task, transaction, sortOrder = null) => {
  const row = await db.WorkOrderTask.findOne({ where: { id: taskId }, transaction });
  if (!row) throw ApiError.badRequest('Task not found');
  const { payload, expenseLines } = await resolveTaskPayload(tenantId, task, transaction);
  const updatePayload = sortOrder !== null ? { ...payload, sort_order: sortOrder } : payload;
  await row.update(updatePayload, { transaction });
  await syncTaskExpenses(taskId, expenseLines, transaction);
  return row;
};

const createTaskWithExpenses = async (tenantId, task, workOrderId, transaction, sortOrder = 0) => {
  const { payload, expenseLines } = await resolveTaskPayload(tenantId, task, transaction);
  const created = await db.WorkOrderTask.create({ ...payload, work_order_id: workOrderId, sort_order: sortOrder }, { transaction });
  if (expenseLines.length > 0) {
    await db.WorkOrderTaskExpense.bulkCreate(
      expenseLines.map((line) => ({
        work_order_task_id: created.id,
        description: line.description,
        amount: line.amount,
        sort_order: line.sort_order,
      })),
      { transaction }
    );
  }
  return created;
};

const getAll = async (tenantId, filters = {}) => {
  const { offset, limit, search, dealId, status } = filters;
  const where = { tenant_id: tenantId };

  if (dealId) where.deal_id = dealId;
  if (status) where.status = status;
  if (search) {
    const s = String(search).trim();
    where[Op.or] = [
      { title: { [Op.like]: `%${s}%` } },
    ];
  }

  const { count, rows } = await db.WorkOrder.findAndCountAll({
    where,
    include: [
      {
        model: db.Deal,
        as: 'deal',
        attributes: ['id', 'deal_number', 'title', 'status'],
        required: false,
      },
      {
        model: db.Quotation,
        as: 'quotation',
        attributes: ['id', 'status'],
        required: false,
      },
      {
        model: db.PurchaseOrder,
        as: 'sourcePurchaseOrder',
        attributes: ['id', 'status', 'document_type', 'company_id', 'supplier_id'],
        required: false,
      },
      taskInclude,
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { workOrders: rows, total: count };
};

const getById = async (tenantId, workOrderId) => {
  const workOrder = await db.WorkOrder.findOne({
    where: { id: workOrderId, tenant_id: tenantId },
    include: [
      {
        model: db.Deal,
        as: 'deal',
        attributes: [
          'id', 'deal_number', 'title', 'status', 'deal_type', 'deal_date', 'description', 'notes',
          'container_type', 'location_type', 'wds_required', 'inspection_required',
          'custom_inspection', 'trakhees_inspection', 'dubai_municipality_inspection',
          'pickup_location', 'pickup_contact_name', 'pickup_contact_number',
          'downstream_partner_supplier_id', 'supplier_id', 'company_id', 'contact_id',
          'total', 'vat_percentage', 'vat_amount', 'subtotal', 'currency', 'is_rcm_applicable',
        ],
        include: [
          { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
          { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
        ],
        required: false,
      },
      {
        model: db.Quotation,
        as: 'quotation',
        attributes: ['id', 'status', 'quotation_date'],
        required: false,
      },
      {
        model: db.PurchaseOrder,
        as: 'sourcePurchaseOrder',
        attributes: ['id', 'status', 'document_type', 'po_date', 'company_id', 'supplier_id'],
        required: false,
        include: [
          { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
          { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
        ],
      },
      {
        model: db.PurchaseOrder,
        as: 'purchaseBill',
        required: false,
        include: [
          {
            model: db.PurchaseOrderItem,
            as: 'items',
            include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name'], required: false }],
          },
        ],
      },
      taskInclude,
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  return workOrder;
};

const create = async (tenantId, data, scope = {}) => {
  const { dealId, quotationId, purchaseOrderId, title, notes, status, tasks } = data;

  let resolvedDealId = dealId || null;
  let resolvedQuotationId = quotationId != null && quotationId !== '' ? parseInt(quotationId, 10) : null;
  let resolvedPurchaseOrderId = purchaseOrderId != null && purchaseOrderId !== '' ? parseInt(purchaseOrderId, 10) : null;

  if (resolvedQuotationId && resolvedPurchaseOrderId) {
    throw ApiError.badRequest('Specify only one of service quotation or purchase order');
  }
  if (!resolvedQuotationId && !resolvedPurchaseOrderId) {
    throw ApiError.badRequest('Work orders must be created from a service order or purchase order');
  }

  if (resolvedQuotationId) {
    if (!Number.isFinite(resolvedQuotationId)) {
      throw ApiError.badRequest('Invalid quotation');
    }
    const quotation = await db.Quotation.findOne({
      where: { id: resolvedQuotationId, tenant_id: tenantId },
    });
    if (!quotation) throw ApiError.badRequest('Quotation not found');
    if (String(quotation.status).toLowerCase() !== 'approved') {
      throw ApiError.badRequest('Service order must be approved before creating a work order');
    }
    const existingWo = await db.WorkOrder.findOne({
      where: { tenant_id: tenantId, quotation_id: resolvedQuotationId },
      attributes: ['id'],
    });
    if (existingWo) {
      throw ApiError.badRequest('A work order already exists for this quotation');
    }
    resolvedDealId = quotation.deal_id;
    if (dealId && Number(dealId) !== Number(quotation.deal_id)) {
      throw ApiError.badRequest('Deal does not match the quotation');
    }
  }

  if (resolvedPurchaseOrderId) {
    if (!Number.isFinite(resolvedPurchaseOrderId)) {
      throw ApiError.badRequest('Invalid purchase order');
    }
    const po = await db.PurchaseOrder.findOne({
      where: { id: resolvedPurchaseOrderId, tenant_id: tenantId },
    });
    if (!po) throw ApiError.badRequest('Purchase order not found');
    if (String(po.status).toLowerCase() !== 'approved') {
      throw ApiError.badRequest('Purchase order must be approved before creating a work order');
    }
    if (String(po.document_type).toLowerCase() === 'bill') {
      throw ApiError.badRequest('Work orders cannot be created from purchase bills');
    }
    const existingWo = await db.WorkOrder.findOne({
      where: { tenant_id: tenantId, purchase_order_id: resolvedPurchaseOrderId },
      attributes: ['id'],
    });
    if (existingWo) {
      throw ApiError.badRequest('A work order already exists for this purchase order');
    }
    resolvedDealId = po.deal_id;
    if (dealId && Number(dealId) !== Number(po.deal_id)) {
      throw ApiError.badRequest('Deal does not match the purchase order');
    }
  }

  if (!resolvedDealId) {
    throw ApiError.badRequest('Deal is required');
  }

  const deal = await db.Deal.findOne({ where: { id: resolvedDealId, tenant_id: tenantId } });
  if (!deal) throw ApiError.badRequest('Deal not found');

  const workOrder = await db.sequelize.transaction(async (t) => {
    const wo = await db.WorkOrder.create(
      {
        tenant_id: tenantId,
        deal_id: resolvedDealId,
        quotation_id: resolvedQuotationId,
        purchase_order_id: resolvedPurchaseOrderId,
        title: title || null,
        notes: notes || null,
        status: status || 'new',
        created_by: scope.userId || null,
      },
      { transaction: t }
    );

    if (tasks && tasks.length > 0) {
      for (let i = 0; i < tasks.length; i++) {
        await createTaskWithExpenses(tenantId, tasks[i], wo.id, t, i);
      }
    }

    return wo;
  });

  return getById(tenantId, workOrder.id);
};

const update = async (tenantId, workOrderId, data) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');

  const prevStatus = workOrder.status;
  const nextStatus = data.status !== undefined ? data.status : prevStatus;

  if (nextStatus === 'completed' && prevStatus !== 'completed') {
    const incompleteTasks = await db.WorkOrderTask.count({
      where: { work_order_id: workOrderId, status: { [db.Sequelize.Op.ne]: 'completed' } },
    });
    if (incompleteTasks > 0) {
      throw ApiError.badRequest(`Cannot complete work order: ${incompleteTasks} task(s) are not yet completed`);
    }
  }

  await db.sequelize.transaction(async (t) => {
    await workOrder.update(
      {
        title: data.title !== undefined ? data.title : workOrder.title,
        notes: data.notes !== undefined ? data.notes : workOrder.notes,
        status: data.status !== undefined ? data.status : workOrder.status,
        deal_id: data.dealId !== undefined ? data.dealId : workOrder.deal_id,
      },
      { transaction: t }
    );

    if (data.tasks !== undefined) {
      const existingTasks = await db.WorkOrderTask.findAll({
        where: { work_order_id: workOrderId },
        transaction: t,
      });
      const existingById = new Map(existingTasks.map((row) => [row.id, row]));
      const keptIds = new Set();

      for (let i = 0; i < data.tasks.length; i++) {
        const task = data.tasks[i];
        const taskId = task.id != null ? parseInt(task.id, 10) : null;
        if (taskId && existingById.has(taskId)) {
          keptIds.add(taskId);
          await updateTaskInPlace(tenantId, taskId, task, t, i);
        } else {
          await createTaskWithExpenses(tenantId, task, workOrderId, t, i);
        }
      }

      for (const existing of existingTasks) {
        if (!keptIds.has(existing.id)) {
          await safeDeleteTask(existing.id, t);
        }
      }
    }
  });

  if (prevStatus !== 'completed' && nextStatus === 'completed') {
    try {
      await purchaseOrderService.ensurePurchaseBillForWorkOrder(tenantId, workOrderId);
    } catch (err) {
      console.warn('[WO] purchase bill auto-create skipped:', err.message);
    }
    try {
      await grnService.ensureGrnForWorkOrder(tenantId, workOrderId, null);
    } catch (err) {
      console.warn('[WO] GRN auto-create skipped:', err.message);
    }
  }

  return getById(tenantId, workOrderId);
};

const updateTaskStatus = async (tenantId, workOrderId, taskId, status) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  const task = await db.WorkOrderTask.findOne({ where: { id: taskId, work_order_id: workOrderId } });
  if (!task) throw ApiError.notFound('Task not found');
  await task.update({ status });
  return task;
};

const updateTaskNotes = async (tenantId, workOrderId, taskId, notes) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  const task = await db.WorkOrderTask.findOne({ where: { id: taskId, work_order_id: workOrderId } });
  if (!task) throw ApiError.notFound('Task not found');
  await task.update({ notes: notes || null });
  return task;
};

const updateTaskAssignment = async (tenantId, workOrderId, taskId, assignedTo) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  const task = await db.WorkOrderTask.findOne({ where: { id: taskId, work_order_id: workOrderId } });
  if (!task) throw ApiError.notFound('Task not found');
  const userId = assignedTo != null ? parseInt(assignedTo, 10) : null;
  if (userId) {
    const user = await db.User.findOne({ where: { id: userId, tenant_id: tenantId, status: 'active' } });
    if (!user) throw ApiError.badRequest('Assigned user not found');
  }
  await task.update({ assigned_to: userId });
  const updated = await db.WorkOrderTask.findOne({
    where: { id: taskId },
    include: [{ model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false }],
  });
  return updated;
};

const remove = async (tenantId, workOrderId) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  await db.WorkOrderTask.destroy({ where: { work_order_id: workOrderId } });
  await workOrder.destroy();
};

module.exports = { getAll, getById, create, update, updateTaskStatus, updateTaskNotes, updateTaskAssignment, remove };
