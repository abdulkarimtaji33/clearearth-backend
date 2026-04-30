const receivablesService = require('../services/receivables.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo, paymentStatus, companyId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await receivablesService.listReceivables(req.tenant.id, {
    ...pagination,
    search,
    dateFrom,
    dateTo,
    paymentStatus,
    companyId,
  });
  return ApiResponse.paginated(res, result.receivables, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const recordPayment = asyncHandler(async (req, res) => {
  const row = await receivablesService.recordPayment(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, row, 'Payment recorded');
});

const agingSummary = asyncHandler(async (req, res) => {
  const data = await receivablesService.getAgingSummary(req.tenant.id, req.query);
  return ApiResponse.success(res, data);
});

module.exports = { list, recordPayment, agingSummary };
