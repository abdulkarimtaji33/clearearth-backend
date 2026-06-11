const driverService = require('../services/driver.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const listPickups = asyncHandler(async (req, res) => {
  const rows = await driverService.listPickups(req.tenant.id, req.user.id);
  return ApiResponse.success(res, rows);
});

const getPickup = asyncHandler(async (req, res) => {
  const row = await driverService.getPickup(req.tenant.id, req.user.id, req.params.taskId);
  return ApiResponse.success(res, row);
});

const startPickup = asyncHandler(async (req, res) => {
  const row = await driverService.startPickup(req.tenant.id, req.user.id, req.params.taskId);
  return ApiResponse.success(res, row, 'Pickup started');
});

const markPickedUp = asyncHandler(async (req, res) => {
  const { quantity, uom, condition, remarks } = req.body;
  const files = req.files || [];
  const row = await driverService.markPickedUp(
    req.tenant.id,
    req.user.id,
    req.params.taskId,
    { quantity, uom, condition, remarks },
    files
  );
  return ApiResponse.success(res, row, 'Marked as picked up');
});

module.exports = { listPickups, getPickup, startPickup, markPickedUp };
