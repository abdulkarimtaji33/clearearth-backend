/**
 * Employee Controller (HRM)
 */
const path = require('path');
const config = require('../config');
const db = require('../models');
const { getFileUrl } = require('../middlewares/upload');
const employeeService = require('../services/employee.service');
const salaryStructureService = require('../services/salaryStructure.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, departmentId, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await employeeService.list(req.tenant.id, { ...pagination, search, departmentId, status });
  return ApiResponse.paginated(res, result.employees, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, employee);
});

const create = asyncHandler(async (req, res) => {
  const employee = await employeeService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, employee, 'Employee created successfully');
});

const update = asyncHandler(async (req, res) => {
  const employee = await employeeService.update(req.tenant.id, req.params.id, req.body, req.user.id);
  return ApiResponse.success(res, employee, 'Employee updated successfully');
});

const offboard = asyncHandler(async (req, res) => {
  const employee = await employeeService.offboard(req.tenant.id, req.user.id, req.params.id, req.body.exitDate);
  return ApiResponse.success(res, employee, 'Employee offboarded successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const employee = await employeeService.getMeEnriched(req.tenant.id, req.user.id);
  return ApiResponse.success(res, employee);
});

const getMySalaryHistory = asyncHandler(async (req, res) => {
  const result = await employeeService.getMySalaryHistory(req.tenant.id, req.user.id);
  return ApiResponse.success(res, result);
});

const getMyHistory = asyncHandler(async (req, res) => {
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  const rows = await employeeService.getHistory(req.tenant.id, employee.id);
  return ApiResponse.success(res, rows);
});

const getHistory = asyncHandler(async (req, res) => {
  const rows = await employeeService.getHistory(req.tenant.id, req.params.employeeId);
  return ApiResponse.success(res, rows);
});

/** HR: upload/replace a specific employee's profile photo */
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const employee = await db.Employee.findOne({ where: { id: req.params.employeeId, tenant_id: req.tenant.id } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  await employee.update({ profile_photo: relativePath });
  const fileUrl = getFileUrl(relativePath);
  return ApiResponse.success(res, { path: relativePath, url: fileUrl }, 'Profile photo updated successfully');
});

/** Self-service: upload/replace the signed-in user's own profile photo */
const uploadMyPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);

  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  await employee.update({ profile_photo: relativePath });
  const fileUrl = getFileUrl(relativePath);
  return ApiResponse.success(res, { path: relativePath, url: fileUrl }, 'Profile photo updated successfully');
});

const createMyChangeRequest = asyncHandler(async (req, res) => {
  const row = await employeeService.createChangeRequest(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Change request submitted');
});

const listMyChangeRequests = asyncHandler(async (req, res) => {
  const rows = await employeeService.listMyChangeRequests(req.tenant.id, req.user.id);
  return ApiResponse.success(res, rows);
});

const listChangeRequests = asyncHandler(async (req, res) => {
  const rows = await employeeService.listPendingChangeRequests(req.tenant.id);
  return ApiResponse.success(res, rows);
});

const approveChangeRequest = asyncHandler(async (req, res) => {
  const row = await employeeService.approveChangeRequest(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, row, 'Change request approved');
});

const rejectChangeRequest = asyncHandler(async (req, res) => {
  const row = await employeeService.rejectChangeRequest(req.tenant.id, req.user.id, req.params.id, req.body.rejectionReason);
  return ApiResponse.success(res, row, 'Change request rejected');
});

const setSalaryStructure = asyncHandler(async (req, res) => {
  const row = await salaryStructureService.set(req.tenant.id, req.user.id, req.params.id, req.body);
  return ApiResponse.created(res, row, 'Salary structure updated successfully');
});

const getSalaryStructureHistory = asyncHandler(async (req, res) => {
  const rows = await salaryStructureService.history(req.tenant.id, req.params.id);
  return ApiResponse.success(res, rows);
});

module.exports = {
  getAll, getById, create, update, offboard, getMe, setSalaryStructure, getSalaryStructureHistory,
  getMySalaryHistory, getMyHistory, getHistory, uploadPhoto, uploadMyPhoto,
  createMyChangeRequest, listMyChangeRequests, listChangeRequests, approveChangeRequest, rejectChangeRequest,
};
