const roleService = require('../services/role.service');
const userAccessService = require('../services/userAccess.service');
const accessAuditService = require('../services/accessAudit.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

/** Who is making the change (for guards + audit trail). */
const actorOf = (req) => ({
  userId: req.user.id,
  tenantId: req.tenant.id,
  roleId: req.user.role_id,
  name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email,
  access: req.access,
});

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await roleService.getAll(req.tenant.id, { ...pagination, search, dateFrom, dateTo });
  return ApiResponse.paginated(res, result.roles, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const role = await roleService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, role);
});

const create = asyncHandler(async (req, res) => {
  const role = await roleService.create(req.tenant.id, req.body, actorOf(req));
  return ApiResponse.created(res, role, 'Role created successfully');
});

const update = asyncHandler(async (req, res) => {
  const role = await roleService.update(req.tenant.id, req.params.id, req.body, actorOf(req));
  return ApiResponse.success(res, role, 'Role updated successfully');
});

const saveAccess = asyncHandler(async (req, res) => {
  const role = await roleService.saveAccess(req.tenant.id, req.params.id, req.body, actorOf(req));
  return ApiResponse.success(res, role, 'Access saved');
});

const reset = asyncHandler(async (req, res) => {
  const role = await roleService.reset(req.tenant.id, req.params.id, actorOf(req));
  return ApiResponse.success(res, role, 'Role restored to its default access');
});

const clone = asyncHandler(async (req, res) => {
  const role = await roleService.create(req.tenant.id, { ...req.body, cloneFromId: req.params.id }, actorOf(req));
  return ApiResponse.created(res, role, 'Role cloned');
});

const remove = asyncHandler(async (req, res) => {
  await roleService.remove(req.tenant.id, req.params.id, actorOf(req));
  return ApiResponse.success(res, null, 'Role deleted');
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await roleService.getUsers(req.tenant.id, req.params.id);
  return ApiResponse.success(res, users);
});

const getCatalog = asyncHandler(async (req, res) => {
  const data = await roleService.getCatalog();
  return ApiResponse.success(res, data);
});

const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getAllPermissions();
  return ApiResponse.success(res, permissions);
});

const assignPermissions = asyncHandler(async (req, res) => {
  const role = await roleService.saveAccess(req.tenant.id, req.params.id, { permissions: req.body.permissions }, actorOf(req));
  return ApiResponse.success(res, role, 'Permissions assigned successfully');
});

const getPermissionHolders = asyncHandler(async (req, res) => {
  const data = await roleService.getPermissionHolders(req.tenant.id, req.params.name);
  return ApiResponse.success(res, data);
});

// ── Per-user access ─────────────────────────────────────────────────────────
const getUserAccess = asyncHandler(async (req, res) => {
  const data = await userAccessService.getUserAccess(req.tenant.id, req.params.userId);
  return ApiResponse.success(res, data);
});

const saveUserOverrides = asyncHandler(async (req, res) => {
  const data = await userAccessService.saveOverrides(req.tenant.id, req.params.userId, req.body.overrides || [], actorOf(req));
  return ApiResponse.success(res, data, 'User access updated');
});

// ── Audit ───────────────────────────────────────────────────────────────────
const getAudit = asyncHandler(async (req, res) => {
  const { targetType, targetId, page, pageSize } = req.query;
  const result = await accessAuditService.list(req.tenant.id, { targetType, targetId, page, pageSize });
  return ApiResponse.paginated(res, result.rows, {
    page: Number(page) || 1,
    pageSize: Math.min(Number(pageSize) || 25, 100),
    totalItems: result.total,
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  saveAccess,
  reset,
  clone,
  remove,
  getUsers,
  getCatalog,
  getAllPermissions,
  assignPermissions,
  getPermissionHolders,
  getUserAccess,
  saveUserOverrides,
  getAudit,
};
