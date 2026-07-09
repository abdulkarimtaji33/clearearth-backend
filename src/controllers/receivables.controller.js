const receivablesService = require('../services/receivables.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

function sendPdf(res, pdfBuffer, fname) {
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
}

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo, paymentStatus, companyId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await receivablesService.listReceivables(req.tenant.id, {
    ...pagination,
    search,
    dateFrom,
    dateTo,
    paymentStatus,
    companyId,
  });
  return ApiResponse.paginated(res, result.receivables, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const recordPayment = asyncHandler(async (req, res) => {
  const row = await receivablesService.recordPayment(req.tenant.id, req.params.id, req.body, req.user?.id);
  return ApiResponse.success(res, row, 'Payment recorded');
});

const listPayments = asyncHandler(async (req, res) => {
  const rows = await receivablesService.listPayments(req.tenant.id, req.params.id);
  return ApiResponse.success(res, rows);
});

const agingSummary = asyncHandler(async (req, res) => {
  const data = await receivablesService.getAgingSummary(req.tenant.id, req.query);
  return ApiResponse.success(res, data);
});

const getReceiptPdf = asyncHandler(async (req, res) => {
  const raw = await pdfService.generateReceivableReceiptPdf(req.params.paymentId, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Payment not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  sendPdf(res, pdfBuffer, `receipt-${req.params.paymentId}.pdf`);
});

const getStatementPdf = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const raw = await pdfService.generateStatementOfAccountPdf(req.tenant.id, req.params.companyId, { dateFrom, dateTo });
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Company not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  sendPdf(res, pdfBuffer, `statement-of-account-${req.params.companyId}.pdf`);
});

module.exports = { list, recordPayment, listPayments, agingSummary, getReceiptPdf, getStatementPdf };
