/**
 * Driver pickup tasks
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compute display priority for a pickup task.
 * overdue  → end_date is in the past (not completed)
 * today    → end_date or start_date is today, or task is already in_progress
 * upcoming → everything else that isn't completed
 */
function computePriority(task) {
  const today = todayStr();
  if (task.status === 'completed') return 'completed';
  if (task.status === 'in_progress') return 'today';
  if (task.end_date && task.end_date < today) return 'overdue';
  if ((task.end_date && task.end_date === today) || (task.start_date && task.start_date === today)) return 'today';
  return 'upcoming';
}

function computeDaysOverdue(task) {
  if (!task.end_date) return 0;
  const today = new Date();
  const end = new Date(`${task.end_date}T12:00:00`);
  return Math.max(0, Math.floor((today - end) / 86400000));
}

const PICKUP_INCLUDES = (tenantId) => [
  {
    model: db.WorkOrder,
    as: 'workOrder',
    required: true,
    where: { tenant_id: tenantId },
    include: [
      {
        model: db.Deal,
        as: 'deal',
        required: false,
        attributes: ['id', 'deal_number', 'title', 'pickup_location', 'pickup_contact_name', 'pickup_contact_number'],
      },
    ],
  },
  { model: db.WorkType, as: 'workType', required: false },
];

const pickupTaskWhere = (userId) => ({
  assigned_to: userId,
  [Op.or]: [
    { type_of_work: { [Op.like]: '%pickup%' } },
    { '$workType.name$': { [Op.like]: '%pickup%' } },
  ],
});

function shapeTask(plain) {
  const priority = computePriority(plain);
  const daysOverdue = priority === 'overdue' ? computeDaysOverdue(plain) : 0;
  return {
    taskId: plain.id,
    workOrderId: plain.work_order_id,
    workOrderTitle: plain.workOrder?.title,
    workOrderStatus: plain.workOrder?.status,
    taskStatus: plain.status,
    typeOfWork: plain.type_of_work || plain.workType?.name,
    startDate: plain.start_date,
    endDate: plain.end_date,
    notes: plain.notes,
    deal: plain.workOrder?.deal || null,
    priority,
    daysOverdue,
  };
}

const PRIORITY_ORDER = { overdue: 0, today: 1, upcoming: 2, completed: 3 };

const listPickups = async (tenantId, userId) => {
  const tasks = await db.WorkOrderTask.findAll({
    include: PICKUP_INCLUDES(tenantId),
    where: pickupTaskWhere(userId),
    order: [['end_date', 'ASC'], ['start_date', 'ASC'], ['id', 'ASC']],
  });

  return tasks
    .map((t) => shapeTask(t.get({ plain: true })))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
};

const startPickup = async (tenantId, userId, taskId) => {
  const task = await db.WorkOrderTask.findOne({
    where: { id: taskId, assigned_to: userId },
    include: [
      { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } },
      { model: db.WorkType, as: 'workType', required: false },
    ],
  });
  if (!task) throw ApiError.notFound('Pickup task not found');

  const isPickup = /pickup/i.test(task.type_of_work || '') || /pickup/i.test(task.workType?.name || '');
  if (!isPickup) throw ApiError.badRequest('Task is not a pickup task');
  if (task.status === 'completed') throw ApiError.badRequest('Task is already completed');

  await task.update({ status: 'in_progress', start_date: task.start_date || todayStr() });
  return { taskId: task.id, status: 'in_progress' };
};

const markPickedUp = async (tenantId, userId, taskId) => {
  const task = await db.WorkOrderTask.findOne({
    where: { id: taskId, assigned_to: userId },
    include: [
      { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } },
      { model: db.WorkType, as: 'workType', required: false },
    ],
  });
  if (!task) throw ApiError.notFound('Pickup task not found');

  const isPickup = /pickup/i.test(task.type_of_work || '') || /pickup/i.test(task.workType?.name || '');
  if (!isPickup) throw ApiError.badRequest('Task is not a pickup task');

  await task.update({ status: 'completed', end_date: todayStr() });
  return { taskId: task.id, status: 'completed' };
};

module.exports = { listPickups, startPickup, markPickedUp };
