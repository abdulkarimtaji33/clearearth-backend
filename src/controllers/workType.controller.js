const workTypeService = require('../services/workType.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getAll = asyncHandler(async (req, res) => {
  const { search, activeOnly } = req.query;
  const rows = await workTypeService.getAll(req.tenant.id, { search, activeOnly });
  return ApiResponse.success(res, rows);
});

const getById = asyncHandler(async (req, res) => {
  const row = await workTypeService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const row = await workTypeService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, row, 'Work type created');
});

const update = asyncHandler(async (req, res) => {
  const row = await workTypeService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, row, 'Work type updated');
});

const remove = asyncHandler(async (req, res) => {
  await workTypeService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Work type deleted');
});

module.exports = { getAll, getById, create, update, remove };
