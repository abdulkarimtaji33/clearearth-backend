const quotationService = require('../services/quotation.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, dealId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await quotationService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    dealId,
  });
  return ApiResponse.paginated(res, result.quotations, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const quotation = await quotationService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, quotation);
});

const create = asyncHandler(async (req, res) => {
  const quotation = await quotationService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, quotation, 'Quotation created successfully');
});

const update = asyncHandler(async (req, res) => {
  const quotation = await quotationService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, quotation, 'Quotation updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await quotationService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Quotation deleted');
});

module.exports = { getAll, getById, create, update, remove };
