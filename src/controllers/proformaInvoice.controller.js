const proformaInvoiceService = require('../services/proformaInvoice.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const { assertCanGenerateInvoice } = require('../utils/roleAccess');

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
  assertCanGenerateInvoice(req);
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

const getPdf = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const invoice = await proformaInvoiceService.getById(req.tenant.id, req.params.id, scope);
  const raw = await pdfService.generateProformaInvoicePdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Proforma invoice not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `proforma-invoice-${(invoice.proforma_number || req.params.id).replace(/[\\/]/g, '-')}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = {
  previewFromQuotation,
  getAll,
  getById,
  create,
  update,
  remove,
  getPdf,
};
