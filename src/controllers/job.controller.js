const jobService = require('../services/job.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, dealId, clientId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await jobService.getAll(req.tenant.id, { ...pagination, search, status, dealId, clientId });
  return ApiResponse.paginated(res, result.jobs, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const job = await jobService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, job);
});

const create = asyncHandler(async (req, res) => {
  const job = await jobService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, job, 'Job created successfully');
});

const update = asyncHandler(async (req, res) => {
  const job = await jobService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, job, 'Job updated successfully');
});

const updateStatus = asyncHandler(async (req, res) => {
  const job = await jobService.updateStatus(req.tenant.id, req.params.id, req.body.status);
  return ApiResponse.success(res, job, 'Job status updated');
});

const remove = asyncHandler(async (req, res) => {
  await jobService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Job deleted');
});

module.exports = { getAll, getById, create, update, updateStatus, remove };
