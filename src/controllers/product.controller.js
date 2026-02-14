const productService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, category } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await productService.getAll(req.tenant.id, { ...pagination, search, status, category });
  return ApiResponse.paginated(res, result.products, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, product, 'Product created successfully');
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, product, 'Product updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  const product = await productService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, product, 'Product approved successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const product = await productService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, product, 'Product deactivated');
});

const activate = asyncHandler(async (req, res) => {
  const product = await productService.activate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, product, 'Product activated');
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Product deleted');
});

module.exports = { getAll, getById, create, update, approve, deactivate, activate, remove };
