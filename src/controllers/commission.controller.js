const commissionService = require('../services/commission.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, status, salesUserId, dealId, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await commissionService.getAll(req.tenant.id, { ...pagination, status, salesUserId, dealId, startDate, endDate });
  return ApiResponse.paginated(res, result.commissions, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const commission = await commissionService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, commission);
});

const calculateCommission = asyncHandler(async (req, res) => {
  const result = await commissionService.calculateCommission(req.tenant.id, req.body);
  return ApiResponse.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const commission = await commissionService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, commission, 'Commission created successfully');
});

const approve = asyncHandler(async (req, res) => {
  const commission = await commissionService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, commission, 'Commission approved');
});

const processPayment = asyncHandler(async (req, res) => {
  const commission = await commissionService.processPayment(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, commission, 'Commission payment processed');
});

const reverseCommission = asyncHandler(async (req, res) => {
  const commission = await commissionService.reverseCommission(req.tenant.id, req.params.id, req.user.id, req.body.reason);
  return ApiResponse.success(res, commission, 'Commission reversed');
});

const getSummary = asyncHandler(async (req, res) => {
  const { salesUserId, startDate, endDate } = req.query;
  const summary = await commissionService.getCommissionSummary(req.tenant.id, { salesUserId, startDate, endDate });
  return ApiResponse.success(res, summary);
});

module.exports = { getAll, getById, calculateCommission, create, approve, processPayment, reverseCommission, getSummary };
