/**
 * Attendance Controller (HRM)
 */
const attendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const checkIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkIn(req.tenant.id, req.user.id);
  return ApiResponse.success(res, record, 'Checked in successfully');
});

const checkOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkOut(req.tenant.id, req.user.id);
  return ApiResponse.success(res, record, 'Checked out successfully');
});

const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await attendanceService.getTodayStatus(req.tenant.id, req.user.id);
  return ApiResponse.success(res, record);
});

const manualUpsert = asyncHandler(async (req, res) => {
  const record = await attendanceService.manualUpsert(req.tenant.id, req.user.id, req.body);
  return ApiResponse.success(res, record, 'Attendance updated successfully');
});

const listAttendance = asyncHandler(async (req, res) => {
  const { employeeId, dateFrom, dateTo, status, page, pageSize } = req.query;
  const { getPaginationParams } = require('../utils/helpers');
  const pagination = getPaginationParams(page, pageSize);
  const result = await attendanceService.listAttendance(req.tenant.id, { ...pagination, employeeId, dateFrom, dateTo, status });
  return ApiResponse.paginated(res, result.records, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getMonthlySheet = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const sheet = await attendanceService.getMonthlySheet(req.tenant.id, req.params.employeeId, Number(year), Number(month));
  return ApiResponse.success(res, sheet);
});

const getMyMonthlySheet = asyncHandler(async (req, res) => {
  const employeeService = require('../services/employee.service');
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  const { year, month } = req.query;
  const now = new Date();
  const sheet = await attendanceService.getMonthlySheet(
    req.tenant.id, employee.id, Number(year) || now.getFullYear(), Number(month) || now.getMonth() + 1
  );
  return ApiResponse.success(res, sheet);
});

const createRegularization = asyncHandler(async (req, res) => {
  const row = await attendanceService.createRegularization(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Regularization request submitted');
});

const listRegularizations = asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;
  const rows = await attendanceService.listRegularizations(req.tenant.id, { status, employeeId });
  return ApiResponse.success(res, rows);
});

const reviewRegularization = asyncHandler(async (req, res) => {
  const row = await attendanceService.reviewRegularization(req.tenant.id, req.user.id, req.params.id, req.body.decision, req.body.reviewNotes);
  return ApiResponse.success(res, row, 'Regularization request reviewed');
});

module.exports = {
  checkIn, checkOut, getTodayStatus, manualUpsert, listAttendance, getMonthlySheet, getMyMonthlySheet,
  createRegularization, listRegularizations, reviewRegularization,
};
