const productServiceService = require('../services/productService.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, category, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await productServiceService.getAll(req.tenant.id, { ...pagination, search, category, status });
  return ApiResponse.paginated(res, result.products, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productServiceService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productServiceService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, product, 'Product/Service created successfully');
});

const update = asyncHandler(async (req, res) => {
  const product = await productServiceService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, product, 'Product/Service updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await productServiceService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Product/Service deleted');
});

module.exports = { getAll, getById, create, update, remove };
