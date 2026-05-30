/**
 * Driver pickup tasks
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const pickupTaskWhere = (userId) => ({
  assigned_to: userId,
  [Op.or]: [
    { type_of_work: { [Op.like]: '%pickup%' } },
    { '$workType.name$': { [Op.like]: '%pickup%' } },
  ],
});

const listPickups = async (tenantId, userId) => {
  const tasks = await db.WorkOrderTask.findAll({
    include: [
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
    ],
    where: pickupTaskWhere(userId),
    order: [['start_date', 'ASC'], ['id', 'ASC']],
  });

  return tasks.map((t) => {
    const plain = t.get({ plain: true });
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
    };
  });
};

const markPickedUp = async (tenantId, userId, taskId) => {
  const task = await db.WorkOrderTask.findOne({
    where: { id: taskId, assigned_to: userId },
    include: [
      {
        model: db.WorkOrder,
        as: 'workOrder',
        required: true,
        where: { tenant_id: tenantId },
      },
      { model: db.WorkType, as: 'workType', required: false },
    ],
  });
  if (!task) throw ApiError.notFound('Pickup task not found');

  const isPickup = /pickup/i.test(task.type_of_work || '') || /pickup/i.test(task.workType?.name || '');
  if (!isPickup) throw ApiError.badRequest('Task is not a pickup task');

  await task.update({ status: 'completed', end_date: new Date().toISOString().slice(0, 10) });
  return { taskId: task.id, status: 'completed' };
};

module.exports = { listPickups, markPickedUp };
