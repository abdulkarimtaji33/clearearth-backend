const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getOverviewKPIs = asyncHandler(async (req, res) => {
  const kpis = await dashboardService.getOverviewKPIs(req.tenant.id);
  return ApiResponse.success(res, kpis);
});

const getSalesTrends = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const trends = await dashboardService.getSalesTrends(req.tenant.id, { startDate, endDate });
  return ApiResponse.success(res, trends);
});

const getMaterialTypeBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await dashboardService.getMaterialTypeBreakdown(req.tenant.id);
  return ApiResponse.success(res, breakdown);
});

const getTopClients = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const clients = await dashboardService.getTopClients(req.tenant.id, limit);
  return ApiResponse.success(res, clients);
});

const getRecentActivities = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const activities = await dashboardService.getRecentActivities(req.tenant.id, limit);
  return ApiResponse.success(res, activities);
});

module.exports = {
  getOverviewKPIs,
  getSalesTrends,
  getMaterialTypeBreakdown,
  getTopClients,
  getRecentActivities,
};
