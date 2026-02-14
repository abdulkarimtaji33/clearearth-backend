const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, department } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await employeeService.getAll(req.tenant.id, { ...pagination, search, status, department });
  return ApiResponse.paginated(res, result.employees, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, employee);
});

const create = asyncHandler(async (req, res) => {
  const employee = await employeeService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, employee, 'Employee created successfully');
});

const update = asyncHandler(async (req, res) => {
  const employee = await employeeService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, employee, 'Employee updated successfully');
});

const terminate = asyncHandler(async (req, res) => {
  const employee = await employeeService.terminate(req.tenant.id, req.params.id, req.body.leavingDate);
  return ApiResponse.success(res, employee, 'Employee terminated');
});

const remove = asyncHandler(async (req, res) => {
  await employeeService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Employee deleted');
});

module.exports = { getAll, getById, create, update, terminate, remove };
