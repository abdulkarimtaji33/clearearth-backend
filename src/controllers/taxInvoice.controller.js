const taxInvoiceService = require('../services/taxInvoice.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const previewFromProforma = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const data = await taxInvoiceService.getPreviewFromProforma(req.tenant.id, req.params.proformaInvoiceId, scope);
  return ApiResponse.success(res, data);
});

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await taxInvoiceService.getAll(req.tenant.id, {
    ...pagination,
    search,
    dateFrom,
    dateTo,
    ...scope,
  });
  return ApiResponse.paginated(res, result.taxInvoices, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await taxInvoiceService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await taxInvoiceService.create(req.tenant.id, req.user.id, req.body, scope);
  return ApiResponse.created(res, row, 'Tax invoice created');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await taxInvoiceService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, row, 'Tax invoice updated');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await taxInvoiceService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Tax invoice deleted');
});

module.exports = {
  previewFromProforma,
  getAll,
  getById,
  create,
  update,
  remove,
};
