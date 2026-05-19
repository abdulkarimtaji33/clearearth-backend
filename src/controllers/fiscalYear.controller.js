const fyService = require('../services/fiscalYear.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const listFiscalYears = asyncHandler(async (req, res) => {
  const result = await fyService.listFiscalYears(req.tenant.id);
  return ApiResponse.success(res, result);
});

const createFiscalYear = asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body;
  const fy = await fyService.createFiscalYear(req.tenant.id, req.user.id, { name, startDate, endDate });
  return ApiResponse.created(res, fy, 'Fiscal year created');
});

const closeFiscalYear = asyncHandler(async (req, res) => {
  const fy = await fyService.closeFiscalYear(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, fy, 'Fiscal year closed');
});

const listPeriods = asyncHandler(async (req, res) => {
  const fy = await fyService.getFiscalYearById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, fy.periods);
});

const closePeriod = asyncHandler(async (req, res) => {
  const period = await fyService.closePeriod(req.tenant.id, req.user.id, req.params.periodId);
  return ApiResponse.success(res, period, 'Period closed');
});

const reopenPeriod = asyncHandler(async (req, res) => {
  const period = await fyService.reopenPeriod(req.tenant.id, req.params.periodId);
  return ApiResponse.success(res, period, 'Period reopened');
});

module.exports = { listFiscalYears, createFiscalYear, closeFiscalYear, listPeriods, closePeriod, reopenPeriod };
