const leadService = require('../services/lead.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, assignedTo, source, companyId, contactId, productServiceId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await leadService.getAll(req.tenant.id, { ...pagination, search, status, assignedTo, source, companyId, contactId, productServiceId, ...scope });
  return ApiResponse.paginated(res, result.leads, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, lead);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, lead, 'Lead created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, lead, 'Lead updated successfully');
});

const qualify = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.qualify(req.tenant.id, req.params.id, req.body.notes, scope);
  return ApiResponse.success(res, lead, 'Lead qualified');
});

const disqualify = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.disqualify(req.tenant.id, req.params.id, req.body.reason, scope);
  return ApiResponse.success(res, lead, 'Lead disqualified');
});

const convertToDeal = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const lead = await leadService.convertToDeal(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, lead, 'Lead marked as converted successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await leadService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Lead deleted');
});

module.exports = { getAll, getById, create, update, qualify, disqualify, convertToDeal, remove };
