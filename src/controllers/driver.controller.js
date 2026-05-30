const driverService = require('../services/driver.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const listPickups = asyncHandler(async (req, res) => {
  const rows = await driverService.listPickups(req.tenant.id, req.user.id);
  return ApiResponse.success(res, rows);
});

const markPickedUp = asyncHandler(async (req, res) => {
  const row = await driverService.markPickedUp(req.tenant.id, req.user.id, req.params.taskId);
  return ApiResponse.success(res, row, 'Marked as picked up');
});

module.exports = { listPickups, markPickedUp };
