const leadService = require('../services/lead.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, assignedTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await leadService.getAll(req.tenant.id, { ...pagination, search, status, assignedTo });
  return ApiResponse.paginated(res, result.leads, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const lead = await leadService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, lead);
});

const create = asyncHandler(async (req, res) => {
  const lead = await leadService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, lead, 'Lead created successfully');
});

const update = asyncHandler(async (req, res) => {
  const lead = await leadService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, lead, 'Lead updated successfully');
});

const qualify = asyncHandler(async (req, res) => {
  const lead = await leadService.qualify(req.tenant.id, req.params.id, req.body.notes);
  return ApiResponse.success(res, lead, 'Lead qualified');
});

const disqualify = asyncHandler(async (req, res) => {
  const lead = await leadService.disqualify(req.tenant.id, req.params.id, req.body.reason);
  return ApiResponse.success(res, lead, 'Lead disqualified');
});

const convertToDeal = asyncHandler(async (req, res) => {
  const deal = await leadService.convertToDeal(req.tenant.id, req.params.id, req.body);
  return ApiResponse.created(res, deal, 'Lead converted to deal successfully');
});

const remove = asyncHandler(async (req, res) => {
  await leadService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Lead deleted');
});

module.exports = { getAll, getById, create, update, qualify, disqualify, convertToDeal, remove };
