/**
 * Employee Controller (HRM)
 */
const employeeService = require('../services/employee.service');
const salaryStructureService = require('../services/salaryStructure.service');
const ApiResponse = require('../utils/apiResponse');
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
  const employee = await employeeService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, employee, 'Employee updated successfully');
});

const offboard = asyncHandler(async (req, res) => {
  const employee = await employeeService.offboard(req.tenant.id, req.user.id, req.params.id, req.body.exitDate);
  return ApiResponse.success(res, employee, 'Employee offboarded successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  return ApiResponse.success(res, employee);
});

const setSalaryStructure = asyncHandler(async (req, res) => {
  const row = await salaryStructureService.set(req.tenant.id, req.user.id, req.params.id, req.body);
  return ApiResponse.created(res, row, 'Salary structure updated successfully');
});

const getSalaryStructureHistory = asyncHandler(async (req, res) => {
  const rows = await salaryStructureService.history(req.tenant.id, req.params.id);
  return ApiResponse.success(res, rows);
});

module.exports = { getAll, getById, create, update, offboard, getMe, setSalaryStructure, getSalaryStructureHistory };
