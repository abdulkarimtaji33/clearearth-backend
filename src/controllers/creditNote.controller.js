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

module.exports = { list, invoiceInfo, getById, create };
