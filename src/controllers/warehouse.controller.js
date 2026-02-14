const warehouseService = require('../services/warehouse.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, type, isActive } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await warehouseService.getAll(req.tenant.id, { ...pagination, search, type, isActive });
  return ApiResponse.paginated(res, result.warehouses, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, warehouse);
});

const create = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, warehouse, 'Warehouse created successfully');
});

const update = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, warehouse, 'Warehouse updated successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, warehouse);
});

const activate = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.activate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, warehouse);
});

const remove = asyncHandler(async (req, res) => {
  await warehouseService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Warehouse deleted');
});

module.exports = { getAll, getById, create, update, deactivate, activate, remove };
