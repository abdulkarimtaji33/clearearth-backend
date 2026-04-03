const quotationService = require('../services/quotation.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, statusNot, dealId, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await quotationService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    statusNot,
    dealId,
    dateFrom,
    dateTo,
    ...scope,
  });
  return ApiResponse.paginated(res, result.quotations, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, quotation);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, quotation, 'Quotation created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, quotation, 'Quotation updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await quotationService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Quotation deleted');
});

const getPdf = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.getById(req.tenant.id, req.params.id, scope);
  const raw = await pdfService.generateQuotationPdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Quotation not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const isOrder = String(quotation?.status || '').toLowerCase() === 'approved';
  const fname = isOrder ? `service-order-${req.params.id}.pdf` : `service-quotation-${req.params.id}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = { getAll, getById, create, update, remove, getPdf };
