const inspectionRequestService = require('../services/inspectionRequest.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dealId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await inspectionRequestService.getAll(req.tenant.id, {
    ...pagination,
    search,
    dealId,
    ...scope,
  });
  return ApiResponse.paginated(res, result.inspectionRequests, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const request = await inspectionRequestService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, request);
});

module.exports = { getAll, getById };
