/**
 * Work Order Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const taskInclude = {
  model: db.WorkOrderTask,
  as: 'tasks',
  include: [
    { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    { model: db.WorkType, as: 'workType', attributes: ['id', 'name'], required: false },
  ],
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
  const status = task.status || 'not_started';
  return {
    type_of_work: typeOfWork,
    work_type_id: workTypeId,
    expense: task.expense != null ? parseFloat(task.expense) : null,
    estimated_duration: task.estimatedDuration || null,
    start_date: task.startDate || null,
    end_date: task.endDate || null,
    assigned_to: task.assignedTo || null,
    status,
    notes: task.notes || null,
  };
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
        attributes: ['id', 'deal_number', 'title', 'status', 'deal_date'],
        include: [
          { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
          { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
        ],
        required: false,
      },
      taskInclude,
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  return workOrder;
};

const create = async (tenantId, data, scope = {}) => {
  const { dealId, title, notes, status, tasks } = data;

  if (dealId) {
    const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
    if (!deal) throw ApiError.badRequest('Deal not found');
  }

  const workOrder = await db.sequelize.transaction(async (t) => {
    const wo = await db.WorkOrder.create(
      {
        tenant_id: tenantId,
        deal_id: dealId || null,
        title: title || null,
        notes: notes || null,
        status: status || 'draft',
        created_by: scope.userId || null,
      },
      { transaction: t }
    );

    if (tasks && tasks.length > 0) {
      const rows = await Promise.all(tasks.map(task => resolveTaskPayload(tenantId, task, t)));
      await db.WorkOrderTask.bulkCreate(
        rows.map(row => ({ ...row, work_order_id: wo.id })),
        { transaction: t }
      );
    }

    return wo;
  });

  return getById(tenantId, workOrder.id);
};

const update = async (tenantId, workOrderId, data) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');

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
      await db.WorkOrderTask.destroy({ where: { work_order_id: workOrderId }, transaction: t });
      if (data.tasks.length > 0) {
        const rows = await Promise.all(data.tasks.map(task => resolveTaskPayload(tenantId, task, t)));
        await db.WorkOrderTask.bulkCreate(
          rows.map(row => ({ ...row, work_order_id: workOrderId })),
          { transaction: t }
        );
      }
    }
  });

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

const remove = async (tenantId, workOrderId) => {
  const workOrder = await db.WorkOrder.findOne({ where: { id: workOrderId, tenant_id: tenantId } });
  if (!workOrder) throw ApiError.notFound('Work order not found');
  await db.WorkOrderTask.destroy({ where: { work_order_id: workOrderId } });
  await workOrder.destroy();
};

module.exports = { getAll, getById, create, update, updateTaskStatus, remove };
