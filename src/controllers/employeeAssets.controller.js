/**
 * Employee Asset (IT asset tracking / custody) Controller
 */
const employeeAssetsService = require('../services/employeeAssets.service');
const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const list = asyncHandler(async (req, res) => {
  const rows = await employeeAssetsService.list(req.tenant.id, req.params.employeeId);
  return ApiResponse.success(res, rows);
});

const create = asyncHandler(async (req, res) => {
  const row = await employeeAssetsService.create(req.tenant.id, req.params.employeeId, req.body);
  return ApiResponse.created(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await employeeAssetsService.update(req.tenant.id, req.params.employeeId, req.params.id, req.body);
  return ApiResponse.success(res, row);
});

const remove = asyncHandler(async (req, res) => {
  await employeeAssetsService.remove(req.tenant.id, req.params.employeeId, req.params.id);
  return ApiResponse.success(res, null, 'Deleted successfully');
});

const markReturned = asyncHandler(async (req, res) => {
  const row = await employeeAssetsService.markReturned(req.tenant.id, req.params.employeeId, req.params.id, req.body?.returnedDate);
  return ApiResponse.success(res, row, 'Asset marked as returned');
});

// Self-service, read-only — replaces the previous static "not available yet" placeholder.
const listMine = asyncHandler(async (req, res) => {
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  const rows = await employeeAssetsService.list(req.tenant.id, employee.id);
  return ApiResponse.success(res, rows);
});

module.exports = { list, create, update, remove, markReturned, listMine };
