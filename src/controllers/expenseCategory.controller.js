const expenseCategoryService = require('../services/expenseCategory.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const { search, activeOnly } = req.query;
  const rows = await expenseCategoryService.getAll(req.tenant.id, { search, activeOnly });
  return ApiResponse.success(res, rows);
});

const getById = asyncHandler(async (req, res) => {
  const row = await expenseCategoryService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const row = await expenseCategoryService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, row, 'Expense category created');
});

const update = asyncHandler(async (req, res) => {
  const row = await expenseCategoryService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, row, 'Expense category updated');
});

const remove = asyncHandler(async (req, res) => {
  await expenseCategoryService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Expense category deleted');
});

module.exports = { getAll, getById, create, update, remove };
