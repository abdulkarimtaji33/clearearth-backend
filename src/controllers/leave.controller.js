/**
 * Leave Controller (HRM)
 */
const leaveService = require('../services/leave.service');
const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const createRequest = asyncHandler(async (req, res) => {
  const row = await leaveService.createRequest(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Leave request submitted');
});

const approve = asyncHandler(async (req, res) => {
  const row = await leaveService.approve(req.tenant.id, req.user, req.params.id);
  return ApiResponse.success(res, row, 'Leave request approved');
});

const reject = asyncHandler(async (req, res) => {
  const row = await leaveService.reject(req.tenant.id, req.user, req.params.id, req.body.reason);
  return ApiResponse.success(res, row, 'Leave request rejected');
});

const cancel = asyncHandler(async (req, res) => {
  const row = await leaveService.cancel(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, row, 'Leave request cancelled');
});

const list = asyncHandler(async (req, res) => {
  const { status, employeeId, mine } = req.query;
  const rows = await leaveService.list(req.tenant.id, req.user, { status, employeeId, mine: mine === 'true' });
  return ApiResponse.success(res, rows);
});

const getMyBalances = asyncHandler(async (req, res) => {
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  const year = Number(req.query.year) || new Date().getFullYear();
  const rows = await leaveService.getBalances(req.tenant.id, employee.id, year);
  return ApiResponse.success(res, rows);
});

const getBalances = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const rows = await leaveService.getBalances(req.tenant.id, req.params.employeeId, year);
  return ApiResponse.success(res, rows);
});

const listLeaveTypes = asyncHandler(async (req, res) => {
  const rows = await leaveService.listLeaveTypes(req.tenant.id);
  return ApiResponse.success(res, rows);
});

const createLeaveType = asyncHandler(async (req, res) => {
  const row = await leaveService.createLeaveType(req.tenant.id, req.body);
  return ApiResponse.created(res, row, 'Leave type created');
});

const updateLeaveType = asyncHandler(async (req, res) => {
  const row = await leaveService.updateLeaveType(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, row, 'Leave type updated');
});

const listHolidays = asyncHandler(async (req, res) => {
  const rows = await leaveService.listHolidays(req.tenant.id);
  return ApiResponse.success(res, rows);
});

const createHoliday = asyncHandler(async (req, res) => {
  const row = await leaveService.createHoliday(req.tenant.id, req.body);
  return ApiResponse.created(res, row, 'Holiday created');
});

const deleteHoliday = asyncHandler(async (req, res) => {
  await leaveService.deleteHoliday(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Holiday deleted');
});

module.exports = {
  createRequest, approve, reject, cancel, list, getMyBalances, getBalances,
  listLeaveTypes, createLeaveType, updateLeaveType, listHolidays, createHoliday, deleteHoliday,
};
