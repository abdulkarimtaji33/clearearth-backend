const roleService = require('../services/role.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await roleService.getAll(req.tenant.id, { ...pagination, search });
  return ApiResponse.paginated(res, result.roles, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const role = await roleService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, role);
});

const create = asyncHandler(async (req, res) => {
  const role = await roleService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, role, 'Role created successfully');
});

const update = asyncHandler(async (req, res) => {
  const role = await roleService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, role, 'Role updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await roleService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Role deleted');
});

const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getAllPermissions();
  return ApiResponse.success(res, permissions);
});

const assignPermissions = asyncHandler(async (req, res) => {
  const role = await roleService.assignPermissionsToRole(req.tenant.id, req.params.id, req.body.permissions);
  return ApiResponse.success(res, role, 'Permissions assigned successfully');
});

module.exports = { getAll, getById, create, update, remove, getAllPermissions, assignPermissions };
