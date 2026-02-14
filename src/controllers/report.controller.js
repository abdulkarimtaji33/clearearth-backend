const reportService = require('../services/report.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getDealReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const report = await reportService.getDealReport(req.tenant.id, { startDate, endDate, status });
  return ApiResponse.success(res, report);
});

const getInvoiceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, clientId } = req.query;
  const report = await reportService.getInvoiceReport(req.tenant.id, { startDate, endDate, status, clientId });
  return ApiResponse.success(res, report);
});

const getInventoryReport = asyncHandler(async (req, res) => {
  const { warehouseId, materialTypeId } = req.query;
  const report = await reportService.getInventoryReport(req.tenant.id, { warehouseId, materialTypeId });
  return ApiResponse.success(res, report);
});

const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await reportService.getSalesReport(req.tenant.id, { startDate, endDate });
  return ApiResponse.success(res, report);
});

const getVATReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await reportService.getVATReport(req.tenant.id, { startDate, endDate });
  return ApiResponse.success(res, report);
});

const getCustomerAgeingReport = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const report = await reportService.getCustomerAgeingReport(req.tenant.id, clientId);
  return ApiResponse.success(res, report);
});

const getCommissionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, salesUserId } = req.query;
  const report = await reportService.getCommissionReport(req.tenant.id, { startDate, endDate, salesUserId });
  return ApiResponse.success(res, report);
});

const getExpenseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, categoryId } = req.query;
  const report = await reportService.getExpenseReport(req.tenant.id, { startDate, endDate, categoryId });
  return ApiResponse.success(res, report);
});

module.exports = {
  getDealReport,
  getInvoiceReport,
  getInventoryReport,
  getSalesReport,
  getVATReport,
  getCustomerAgeingReport,
  getCommissionReport,
  getExpenseReport,
};
