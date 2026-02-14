const serviceService = require('../services/service.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, category } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await serviceService.getAll(req.tenant.id, { ...pagination, search, status, category });
  return ApiResponse.paginated(res, result.services, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const service = await serviceService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, service);
});

const create = asyncHandler(async (req, res) => {
  const service = await serviceService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, service, 'Service created successfully');
});

const update = asyncHandler(async (req, res) => {
  const service = await serviceService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, service, 'Service updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  const service = await serviceService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, service, 'Service approved successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const service = await serviceService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, service);
});

const activate = asyncHandler(async (req, res) => {
  const service = await serviceService.activate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, service);
});

const remove = asyncHandler(async (req, res) => {
  await serviceService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Service deleted');
});

module.exports = { getAll, getById, create, update, approve, deactivate, activate, remove };
