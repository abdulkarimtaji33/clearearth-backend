const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const overview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.tenant?.id, req.user);
  return ApiResponse.success(res, data);
});

module.exports = { overview };
