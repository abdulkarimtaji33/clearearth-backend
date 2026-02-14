const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { JOB_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, dealId, clientId } = filters;
  const where = { tenant_id: tenantId };

  if (search) where[Op.or] = [{ job_number: { [Op.like]: `%${search}%` } }];
  if (status) where.status = status;
  if (dealId) where.deal_id = dealId;
  if (clientId) where.client_id = clientId;

  const { count, rows } = await db.Job.findAndCountAll({
    where,
    include: [
      { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'] },
      { model: db.Client, as: 'client', attributes: ['id', 'company_name', 'email'] },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'] },
      { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { jobs: rows, total: count };
};

const getById = async (tenantId, jobId) => {
  const job = await db.Job.findOne({
    where: { id: jobId, tenant_id: tenantId },
    include: [
      { model: db.Deal, as: 'deal' },
      { model: db.Client, as: 'client' },
      { model: db.User, as: 'assignedUser' },
      { model: db.Warehouse, as: 'warehouse' },
      { model: db.Inspection, as: 'inspections' },
      { model: db.GoodsReceiptNote, as: 'grns' },
      { model: db.Lot, as: 'lots' },
    ],
  });

  if (!job) throw ApiError.notFound('Job not found');
  return job;
};

const create = async (tenantId, userId, data) => {
  const jobNumber = generateReferenceNumber('JOB');

  const job = await db.Job.create({
    tenant_id: tenantId,
    job_number: jobNumber,
    deal_id: data.dealId,
    client_id: data.clientId,
    job_type: data.jobType,
    description: data.description,
    scheduled_date: data.scheduledDate,
    assigned_to: data.assignedTo || userId,
    warehouse_id: data.warehouseId,
    status: JOB_STATUS.PENDING,
    notes: data.notes,
  });

  return await getById(tenantId, job.id);
};

const update = async (tenantId, jobId, data) => {
  const job = await db.Job.findOne({ where: { id: jobId, tenant_id: tenantId } });
  if (!job) throw ApiError.notFound('Job not found');

  if (job.status === JOB_STATUS.COMPLETED || job.status === JOB_STATUS.CANCELLED) {
    throw ApiError.badRequest('Cannot update completed or cancelled job');
  }

  await job.update({
    description: data.description || job.description,
    scheduled_date: data.scheduledDate || job.scheduled_date,
    assigned_to: data.assignedTo ?? job.assigned_to,
    notes: data.notes || job.notes,
  });

  return await getById(tenantId, jobId);
};

const updateStatus = async (tenantId, jobId, status) => {
  const job = await db.Job.findOne({ where: { id: jobId, tenant_id: tenantId } });
  if (!job) throw ApiError.notFound('Job not found');

  const updateData = { status };

  if (status === JOB_STATUS.IN_PROGRESS && !job.start_date) {
    updateData.start_date = new Date();
  }

  if (status === JOB_STATUS.COMPLETED) {
    updateData.completion_date = new Date();
  }

  await job.update(updateData);
  return await getById(tenantId, jobId);
};

const addCost = async (tenantId, jobId, cost) => {
  const job = await db.Job.findOne({ where: { id: jobId, tenant_id: tenantId } });
  if (!job) throw ApiError.notFound('Job not found');

  await job.update({
    total_cost: parseFloat(job.total_cost || 0) + parseFloat(cost),
  });

  return await getById(tenantId, jobId);
};

const remove = async (tenantId, jobId) => {
  const job = await db.Job.findOne({ where: { id: jobId, tenant_id: tenantId } });
  if (!job) throw ApiError.notFound('Job not found');

  if (job.status === JOB_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot delete completed job');
  }

  await job.destroy();
};

module.exports = { getAll, getById, create, update, updateStatus, addCost, remove };
