const service = require('../services/quotationCorrection.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getSalesScope } = require('../utils/scopeHelper');

const list = asyncHandler(async (req, res) => ApiResponse.success(res, await service.list(req.tenant.id, req.params.id)));

const create = asyncHandler(async (req, res) => {
  const row = await service.create(req.tenant.id, req.params.id, req.user, req.body.message);
  return ApiResponse.created(res, row, 'Correction requested from sales');
});

const resolve = asyncHandler(async (req, res) => {
  const row = await service.resolve(req.tenant.id, req.params.id, req.params.requestId, req.user, req.body.note, getSalesScope(req));
  return ApiResponse.success(res, row, 'Marked as corrected');
});

module.exports = { list, create, resolve };
