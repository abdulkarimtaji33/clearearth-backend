const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { DEAL_STATUS, DEPARTMENT_STAGE } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, dealType, assignedTo } = filters;
  const where = { tenant_id: tenantId };

  if (search) where[Op.or] = [{ title: { [Op.like]: `%${search}%` } }, { deal_number: { [Op.like]: `%${search}%` } }];
  if (status) where.status = status;
  if (dealType) where.deal_type = dealType;
  if (assignedTo) where.assigned_to = assignedTo;

  const { count, rows } = await db.Deal.findAndCountAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name', 'email'] },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'] },
      { model: db.User, as: 'currentHandler', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { deals: rows, total: count };
};

const getById = async (tenantId, dealId) => {
  const deal = await db.Deal.findOne({
    where: { id: dealId, tenant_id: tenantId },
    include: [
      { model: db.Client, as: 'client' },
      { model: db.Lead, as: 'lead' },
      { model: db.User, as: 'assignedUser' },
      { model: db.User, as: 'currentHandler' },
      { model: db.DealStage, as: 'stages', order: [['started_at', 'ASC']] },
      { model: db.Job, as: 'jobs' },
    ],
  });
  if (!deal) throw ApiError.notFound('Deal not found');
  return deal;
};

const create = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const dealNumber = generateReferenceNumber('DEAL');

    const deal = await db.Deal.create(
      {
        tenant_id: tenantId,
        deal_number: dealNumber,
        client_id: data.clientId,
        deal_type: data.dealType,
        title: data.title,
        description: data.description,
        service_type: data.serviceType || [],
        expected_value: data.expectedValue,
        currency: data.currency || 'AED',
        expected_closure_date: data.expectedClosureDate,
        probability: data.probability || 50,
        assigned_to: data.assignedTo || userId,
        current_stage: 'sales',
        current_department: 'sales',
        handler_user_id: data.assignedTo || userId,
        status: DEAL_STATUS.DRAFT,
        notes: data.notes,
      },
      { transaction }
    );

    // Create initial stage
    await db.DealStage.create(
      {
        tenant_id: tenantId,
        deal_id: deal.id,
        stage_name: 'sales',
        department: 'sales',
        handler_user_id: deal.handler_user_id,
        started_at: new Date(),
        is_completed: false,
      },
      { transaction }
    );

    await transaction.commit();
    return await getById(tenantId, deal.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (tenantId, dealId, data) => {
  const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
  if (!deal) throw ApiError.notFound('Deal not found');

  if ([DEAL_STATUS.WON, DEAL_STATUS.LOST, DEAL_STATUS.CANCELLED].includes(deal.status)) {
    throw ApiError.badRequest('Cannot update finalized deal');
  }

  await deal.update({
    title: data.title || deal.title,
    description: data.description || deal.description,
    service_type: data.serviceType || deal.service_type,
    expected_value: data.expectedValue ?? deal.expected_value,
    expected_closure_date: data.expectedClosureDate || deal.expected_closure_date,
    probability: data.probability ?? deal.probability,
    notes: data.notes || deal.notes,
  });

  return await getById(tenantId, dealId);
};

const moveToStage = async (tenantId, dealId, newStage, newDepartment, handlerUserId, notes) => {
  const transaction = await db.sequelize.transaction();

  try {
    const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId }, transaction });
    if (!deal) throw ApiError.notFound('Deal not found');

    if ([DEAL_STATUS.WON, DEAL_STATUS.LOST, DEAL_STATUS.CANCELLED].includes(deal.status)) {
      throw ApiError.badRequest('Cannot move finalized deal');
    }

    // Complete current stage
    const currentStage = await db.DealStage.findOne({
      where: { deal_id: dealId, is_completed: false },
      transaction,
    });

    if (currentStage) {
      await currentStage.update(
        {
          completed_at: new Date(),
          is_completed: true,
          notes: notes || currentStage.notes,
        },
        { transaction }
      );
    }

    // Create new stage
    await db.DealStage.create(
      {
        tenant_id: tenantId,
        deal_id: dealId,
        stage_name: newStage,
        department: newDepartment,
        handler_user_id: handlerUserId,
        started_at: new Date(),
        is_completed: false,
      },
      { transaction }
    );

    // Update deal
    await deal.update(
      {
        current_stage: newStage,
        current_department: newDepartment,
        handler_user_id: handlerUserId,
        status: DEAL_STATUS.NEGOTIATION,
      },
      { transaction }
    );

    await transaction.commit();
    return await getById(tenantId, dealId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const finalize = async (tenantId, dealId, finalStatus, reason, userId) => {
  const transaction = await db.sequelize.transaction();

  try {
    const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId }, transaction });
    if (!deal) throw ApiError.notFound('Deal not found');

    if ([DEAL_STATUS.WON, DEAL_STATUS.LOST, DEAL_STATUS.CANCELLED].includes(deal.status)) {
      throw ApiError.badRequest('Deal already finalized');
    }

    // Complete current stage
    const currentStage = await db.DealStage.findOne({
      where: { deal_id: dealId, is_completed: false },
      transaction,
    });

    if (currentStage) {
      await currentStage.update({ completed_at: new Date(), is_completed: true }, { transaction });
    }

    // Update deal
    const updateData = {
      status: finalStatus,
      actual_closure_date: new Date(),
      finalized_at: new Date(),
      finalized_by: userId,
    };

    if (finalStatus === DEAL_STATUS.WON) {
      updateData.won_reason = reason;
    } else if (finalStatus === DEAL_STATUS.LOST) {
      updateData.lost_reason = reason;
    }

    await deal.update(updateData, { transaction });

    await transaction.commit();
    return await getById(tenantId, dealId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const remove = async (tenantId, dealId) => {
  const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
  if (!deal) throw ApiError.notFound('Deal not found');

  if (deal.status === DEAL_STATUS.WON) {
    throw ApiError.badRequest('Cannot delete won deal');
  }

  await deal.destroy();
};

const getStatistics = async (tenantId) => {
  const [totalDeals, wonDeals, lostDeals, activeDeals, totalValue, wonValue] = await Promise.all([
    db.Deal.count({ where: { tenant_id: tenantId } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: DEAL_STATUS.WON } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: DEAL_STATUS.LOST } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: { [Op.notIn]: [DEAL_STATUS.WON, DEAL_STATUS.LOST, DEAL_STATUS.CANCELLED] } } }),
    db.Deal.sum('expected_value', { where: { tenant_id: tenantId } }),
    db.Deal.sum('expected_value', { where: { tenant_id: tenantId, status: DEAL_STATUS.WON } }),
  ]);

  return {
    totalDeals: totalDeals || 0,
    wonDeals: wonDeals || 0,
    lostDeals: lostDeals || 0,
    activeDeals: activeDeals || 0,
    totalValue: totalValue || 0,
    wonValue: wonValue || 0,
    conversionRate: totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(2) : 0,
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  moveToStage,
  finalize,
  remove,
  getStatistics,
};
