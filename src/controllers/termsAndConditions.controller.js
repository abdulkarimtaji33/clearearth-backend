const termsService = require('../services/termsAndConditions.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, category, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await termsService.getAll(req.tenant.id, { ...pagination, search, status, category, dateFrom, dateTo });
  return ApiResponse.paginated(res, result.terms, { 
    page: pagination.page, 
    pageSize: pagination.pageSize, 
    totalItems: result.total 
  });
});

const getById = asyncHandler(async (req, res) => {
  const terms = await termsService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, terms);
});

const create = asyncHandler(async (req, res) => {
  const terms = await termsService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, terms, 'Terms and Conditions created successfully');
});

const update = asyncHandler(async (req, res) => {
  const terms = await termsService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, terms, 'Terms and Conditions updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await termsService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Terms and Conditions deleted successfully');
});

module.exports = { getAll, getById, create, update, remove };
