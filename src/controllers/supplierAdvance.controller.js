const svc = require('../services/supplierAdvance.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, supplierId, openOnly } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await svc.listAdvances(req.tenant.id, { ...pagination, search, supplierId, openOnly });
  return ApiResponse.paginated(res, result.advances, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => ApiResponse.success(res, await svc.getAdvance(req.tenant.id, req.params.id)));
const applyOptions = asyncHandler(async (req, res) => ApiResponse.success(res, await svc.getApplyOptions(req.tenant.id, req.params.supplierId)));
const create = asyncHandler(async (req, res) => ApiResponse.created(res, await svc.recordAdvance(req.tenant.id, req.user.id, req.body), 'Advance recorded'));
const apply = asyncHandler(async (req, res) => ApiResponse.success(res, await svc.applyAdvance(req.tenant.id, req.user.id, req.params.id, req.body), 'Advance applied'));

module.exports = { list, getById, applyOptions, create, apply };
