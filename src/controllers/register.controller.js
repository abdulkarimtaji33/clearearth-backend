const registerService = require('../services/register.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { kind } = req.params;
  if (!registerService.KINDS.includes(kind)) throw ApiError.notFound('Unknown register');
  const pagination = getPaginationParams(req.query.page, req.query.pageSize);
  const result = await registerService.list(req.tenant.id, kind, { search: req.query.search, docType: req.query.type, ...pagination });
  return ApiResponse.paginated(res, result.rows, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

module.exports = { list };
