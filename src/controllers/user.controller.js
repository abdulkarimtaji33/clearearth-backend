/**
 * User Controller
 */
const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, roleId, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await userService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    roleId,
    dateFrom,
    dateTo,
  });

  return ApiResponse.paginated(res, result.users, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getInspectors = asyncHandler(async (req, res) => {
  const users = await userService.getInspectors(req.tenant.id);
  return ApiResponse.success(res, users);
});

const getDrivers = asyncHandler(async (req, res) => {
  const users = await userService.getDrivers(req.tenant.id);
  return ApiResponse.success(res, users);
});

const getAssignees = asyncHandler(async (req, res) => {
  const users = await userService.getAssignees(req.tenant.id);
  return ApiResponse.success(res, users);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, user);
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, user, 'User created successfully');
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, user, 'User updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'User deleted successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await userService.changePassword(req.tenant.id, req.params.id, req.body.password);
  return ApiResponse.success(res, user, 'Password updated successfully');
});

module.exports = { getAll, getInspectors, getDrivers, getAssignees, getById, create, update, remove, changePassword };
