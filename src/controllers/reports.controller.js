const reportsService = require('../services/reports.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const ApiError = require('../utils/apiError');

function requireDateRange(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) throw ApiError.badRequest('dateFrom and dateTo are required');
}

const getTrialBalance = asyncHandler(async (req, res) => {
  const { asOfDate } = req.query;
  const result = await reportsService.getTrialBalance(req.tenant.id, { asOfDate });
  return ApiResponse.success(res, result);
});

const getGeneralLedger = asyncHandler(async (req, res) => {
  const { accountId, dateFrom, dateTo, page, pageSize, paidTo, receivedFrom, search } = req.query;
  const result = await reportsService.getGeneralLedger(req.tenant.id, {
    accountId: accountId || 'all',
    dateFrom,
    dateTo,
    page: parseInt(page, 10) || 1,
    pageSize: parseInt(pageSize, 10) || 50,
    paidTo,
    receivedFrom,
    search,
  });
  return ApiResponse.success(res, result);
});

const getIncomeStatement = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, comparativeDateFrom, comparativeDateTo } = req.query;
  requireDateRange(dateFrom, dateTo);
  const result = await reportsService.getIncomeStatement(req.tenant.id, { dateFrom, dateTo, comparativeDateFrom, comparativeDateTo });
  return ApiResponse.success(res, result);
});

const getBalanceSheet = asyncHandler(async (req, res) => {
  const { asOfDate, comparativeAsOfDate } = req.query;
  const result = await reportsService.getBalanceSheet(req.tenant.id, { asOfDate, comparativeAsOfDate });
  return ApiResponse.success(res, result);
});

const getCashFlowStatement = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  requireDateRange(dateFrom, dateTo);
  const result = await reportsService.getCashFlowStatement(req.tenant.id, { dateFrom, dateTo });
  return ApiResponse.success(res, result);
});

const getChangesInEquity = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  requireDateRange(dateFrom, dateTo);
  const result = await reportsService.getChangesInEquity(req.tenant.id, { dateFrom, dateTo });
  return ApiResponse.success(res, result);
});

const getVatReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  requireDateRange(dateFrom, dateTo);
  const result = await reportsService.getVatReport(req.tenant.id, { dateFrom, dateTo });
  return ApiResponse.success(res, result);
});

module.exports = {
  getTrialBalance,
  getGeneralLedger,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getChangesInEquity,
  getVatReport,
};
