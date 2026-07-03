const leadService = require('../services/lead.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, assignedTo, source, companyId, contactId, productServiceId, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req, 'leads');
  const result = await leadService.getAll(req.tenant.id, { ...pagination, search, status, assignedTo, source, companyId, contactId, productServiceId, dateFrom, dateTo, ...scope });
  return ApiResponse.paginated(res, result.leads, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, lead);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  scope._actorUser = req.user;
  const lead = await leadService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, lead, 'Lead created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.update(req.tenant.id, req.params.id, req.body, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
    hasPermission: req.user.hasPermission,
  });
  return ApiResponse.success(res, lead, 'Lead updated successfully');
});

const qualify = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.qualify(req.tenant.id, req.params.id, req.body.notes, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
    hasPermission: req.user.hasPermission,
  });
  return ApiResponse.success(res, lead, 'Lead approved');
});

const requestApproval = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.requestApproval(req.tenant.id, req.params.id, scope, req.user);
  return ApiResponse.success(res, lead, 'Approval requested');
});

const approveWithPin = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.approveWithPin(req.tenant.id, req.params.id, req.body.pin, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
    hasPermission: req.user.hasPermission,
  });
  return ApiResponse.success(res, lead, 'Lead approved');
});

const disqualify = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.disqualify(req.tenant.id, req.params.id, req.body.reason, scope);
  return ApiResponse.success(res, lead, 'Lead disqualified');
});

const convertToDeal = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  const lead = await leadService.convertToDeal(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, lead, 'Lead marked as converted successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'leads');
  await leadService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Lead deleted');
});

module.exports = { getAll, getById, create, update, qualify, requestApproval, approveWithPin, disqualify, convertToDeal, remove };
