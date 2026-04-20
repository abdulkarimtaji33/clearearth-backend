const proformaInvoiceService = require('../services/proformaInvoice.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const previewFromQuotation = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const data = await proformaInvoiceService.getPreviewFromQuotation(req.tenant.id, req.params.quotationId, scope);
  return ApiResponse.success(res, data);
});

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await proformaInvoiceService.getAll(req.tenant.id, {
    ...pagination,
    search,
    dateFrom,
    dateTo,
    ...scope,
  });
  return ApiResponse.paginated(res, result.proformaInvoices, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await proformaInvoiceService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await proformaInvoiceService.create(req.tenant.id, req.user.id, req.body, scope);
  return ApiResponse.created(res, row, 'Proforma invoice created');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const row = await proformaInvoiceService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, row, 'Proforma invoice updated');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await proformaInvoiceService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Proforma invoice deleted');
});

module.exports = {
  previewFromQuotation,
  getAll,
  getById,
  create,
  update,
  remove,
};
