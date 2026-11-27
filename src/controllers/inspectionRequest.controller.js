const inspectionRequestService = require('../services/inspectionRequest.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dealId, status, priority, responseStatus, dateFrom, dateTo, requestedBy, updatedFrom } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await inspectionRequestService.getAll(req.tenant.id, {
    ...pagination,
    search,
    dealId,
    status,
    priority,
    responseStatus,
    dateFrom,
    dateTo,
    requestedBy,
    updatedFrom,
    ...scope,
  });
  return ApiResponse.paginated(res, result.inspectionRequests, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getRequesters = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const rows = await inspectionRequestService.getRequesters(req.tenant.id, scope);
  return ApiResponse.success(res, rows);
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const request = await inspectionRequestService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, request);
});

const updateStatus = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const { status } = req.body;
  const request = await inspectionRequestService.updateStatus(req.tenant.id, req.params.id, status, scope);
  return ApiResponse.success(res, request);
});

const updatePriority = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const { priority } = req.body;
  const request = await inspectionRequestService.updatePriority(req.tenant.id, req.params.id, priority, scope);
  return ApiResponse.success(res, request);
});

const acceptRequest = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const request = await inspectionRequestService.acceptRequest(req.tenant.id, req.params.id, scope, req.user);
  return ApiResponse.success(res, request, 'Inspection request accepted');
});

const rejectRequest = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const { reason } = req.body;
  const request = await inspectionRequestService.rejectRequest(req.tenant.id, req.params.id, reason, scope, req.user);
  return ApiResponse.success(res, request, 'Inspection request rejected');
});

module.exports = { getAll, getRequesters, getById, updateStatus, updatePriority, acceptRequest, rejectRequest };
