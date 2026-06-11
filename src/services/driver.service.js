/**
 * Driver pickup tasks
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const path = require('path');
const { Op } = db.Sequelize;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

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

const PICKUP_DETAIL_INCLUDES = (tenantId) => [
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
        include: [
          {
            model: db.Company,
            as: 'company',
            required: false,
            attributes: ['id', 'name', 'address', 'city', 'country'],
          },
          {
            model: db.DealInspectionRequest,
            as: 'inspectionRequest',
            required: false,
            include: [
              {
                model: db.MaterialType,
                as: 'materialType',
                required: false,
                attributes: ['id', 'value', 'display_name'],
              },
            ],
          },
        ],
      },
    ],
  },
  { model: db.WorkType, as: 'workType', required: false },
  { model: db.WorkOrderTaskFile, as: 'files', required: false },
  { model: db.User, as: 'assignedUser', required: false, attributes: ['id', 'first_name', 'last_name', 'email'] },
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

function shapeTaskDetail(plain) {
  const base = shapeTask(plain);
  const deal = plain.workOrder?.deal || null;
  const ir = deal?.inspectionRequest || null;

  return {
    ...base,
    pickupQuantity: plain.pickup_quantity,
    pickupCondition: plain.pickup_condition,
    assignedUser: plain.assignedUser
      ? { id: plain.assignedUser.id, name: `${plain.assignedUser.first_name || ''} ${plain.assignedUser.last_name || ''}`.trim() }
      : null,
    files: (plain.files || []).map((f) => ({ id: f.id, imageUrl: f.image_url, originalName: f.original_name })),
    deal: deal
      ? {
          id: deal.id,
          deal_number: deal.deal_number,
          title: deal.title,
          pickup_location: deal.pickup_location,
          pickup_contact_name: deal.pickup_contact_name,
          pickup_contact_number: deal.pickup_contact_number,
          company: deal.company || null,
        }
      : null,
    material: ir
      ? {
          materialType: ir.materialType?.display_name || null,
          materialTypeId: ir.material_type_id,
          quantity: ir.quantity,
          unit: ir.quantity_uom,
          specification: ir.notes || null,
        }
      : null,
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

const getPickup = async (tenantId, userId, taskId) => {
  const task = await db.WorkOrderTask.findOne({
    include: PICKUP_DETAIL_INCLUDES(tenantId),
    where: { id: taskId, assigned_to: userId },
  });
  if (!task) throw ApiError.notFound('Pickup task not found');
  return shapeTaskDetail(task.get({ plain: true }));
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

const markPickedUp = async (tenantId, userId, taskId, { quantity, condition, remarks } = {}, files = []) => {
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

  const updates = { status: 'completed', end_date: todayStr() };
  if (quantity !== undefined && quantity !== '') updates.pickup_quantity = quantity;
  if (condition !== undefined && condition !== '') updates.pickup_condition = condition;
  if (remarks !== undefined && remarks !== '') updates.notes = remarks;

  await task.update(updates);

  if (files.length > 0) {
    const fileRecords = files.map((f) => ({
      task_id: task.id,
      image_url: `/uploads/images/${path.basename(f.path)}`,
      original_name: f.originalname,
    }));
    await db.WorkOrderTaskFile.bulkCreate(fileRecords);
  }

  return { taskId: task.id, status: 'completed' };
};

module.exports = { listPickups, getPickup, startPickup, markPickedUp };
