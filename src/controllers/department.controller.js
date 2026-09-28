/**
 * Department Controller (HRM)
 */
const departmentService = require('../services/department.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await departmentService.list(req.tenant.id, { ...pagination, search, status });
  return ApiResponse.paginated(res, result.departments, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const dept = await departmentService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, dept);
});

const create = asyncHandler(async (req, res) => {
  const dept = await departmentService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, dept, 'Department created successfully');
});

const update = asyncHandler(async (req, res) => {
  const dept = await departmentService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, dept, 'Department updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await departmentService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Department deleted successfully');
});

module.exports = { getAll, getById, create, update, remove };
