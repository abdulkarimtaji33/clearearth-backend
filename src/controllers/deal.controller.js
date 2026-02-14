const dealService = require('../services/deal.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, dealType, assignedTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await dealService.getAll(req.tenant.id, { ...pagination, search, status, dealType, assignedTo });
  return ApiResponse.paginated(res, result.deals, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const deal = await dealService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, deal);
});

const create = asyncHandler(async (req, res) => {
  const deal = await dealService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, deal, 'Deal created successfully');
});

const update = asyncHandler(async (req, res) => {
  const deal = await dealService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, deal, 'Deal updated successfully');
});

const moveToStage = asyncHandler(async (req, res) => {
  const { stage, department, handlerUserId, notes } = req.body;
  const deal = await dealService.moveToStage(req.tenant.id, req.params.id, stage, department, handlerUserId, notes);
  return ApiResponse.success(res, deal, 'Deal moved to next stage');
});

const finalize = asyncHandler(async (req, res) => {
  const { finalStatus, reason } = req.body;
  const deal = await dealService.finalize(req.tenant.id, req.params.id, finalStatus, reason, req.user.id);
  return ApiResponse.success(res, deal, 'Deal finalized successfully');
});

const remove = asyncHandler(async (req, res) => {
  await dealService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Deal deleted');
});

const getStatistics = asyncHandler(async (req, res) => {
  const stats = await dealService.getStatistics(req.tenant.id);
  return ApiResponse.success(res, stats);
});

module.exports = { getAll, getById, create, update, moveToStage, finalize, remove, getStatistics };
