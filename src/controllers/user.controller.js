/**
 * User Controller
 */
const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, roleId } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await userService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    roleId,
  });

  return ApiResponse.paginated(res, result.users, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
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

module.exports = { getAll, getById, create, update, remove };
