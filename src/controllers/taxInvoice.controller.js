const taxInvoiceService = require('../services/taxInvoice.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const { assertCanGenerateInvoice } = require('../utils/roleAccess');

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
  assertCanGenerateInvoice(req);
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

const getPdf = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const invoice = await taxInvoiceService.getById(req.tenant.id, req.params.id, scope);
  const raw = await pdfService.generateTaxInvoicePdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Tax invoice not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `tax-invoice-${(invoice.tax_invoice_number || req.params.id).replace(/[\\/]/g, '-')}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = {
  previewFromProforma,
  getAll,
  getById,
  create,
  update,
  remove,
  getPdf,
};
