const creditNoteService = require('../services/creditNote.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, taxInvoiceId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await creditNoteService.listCreditNotes(req.tenant.id, { ...pagination, search, taxInvoiceId });
  return ApiResponse.paginated(res, result.creditNotes, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const invoiceInfo = asyncHandler(async (req, res) => {
  const info = await creditNoteService.getInvoiceCreditInfo(req.tenant.id, req.params.taxInvoiceId);
  return ApiResponse.success(res, info);
});

const getById = asyncHandler(async (req, res) => {
  const row = await creditNoteService.getCreditNote(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const row = await creditNoteService.createCreditNote(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Credit note issued');
});

const getPdf = asyncHandler(async (req, res) => {
  const pdfService = require('../services/pdf.service');
  const note = await creditNoteService.getCreditNote(req.tenant.id, req.params.id);
  const raw = await pdfService.generateCreditNotePdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Credit note not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="credit-note-${String(note.credit_note_number).replace(/[\\/]/g, '-')}.pdf"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = { list, invoiceInfo, getById, create, getPdf };
