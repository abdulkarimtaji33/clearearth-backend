/**
 * Client Controller
 */
const clientService = require('../services/client.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, clientType } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await clientService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    clientType,
  });

  return ApiResponse.paginated(res, result.clients, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const client = await clientService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, client);
});

const create = asyncHandler(async (req, res) => {
  const client = await clientService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, client, 'Client created successfully');
});

const update = asyncHandler(async (req, res) => {
  const client = await clientService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, client, 'Client updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  const client = await clientService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, client, 'Client approved successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const client = await clientService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, client, 'Client deactivated successfully');
});

const activate = asyncHandler(async (req, res) => {
  const client = await clientService.activate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, client, 'Client activated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await clientService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Client deleted successfully');
});

const getStatistics = asyncHandler(async (req, res) => {
  const stats = await clientService.getStatistics(req.tenant.id, req.params.id);
  return ApiResponse.success(res, stats);
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  approve,
  deactivate,
  activate,
  remove,
  getStatistics,
};
