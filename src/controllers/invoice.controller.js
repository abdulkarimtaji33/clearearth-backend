const invoiceService = require('../services/invoice.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, invoiceType, clientId, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await invoiceService.getAll(req.tenant.id, { ...pagination, search, status, invoiceType, clientId, startDate, endDate });
  return ApiResponse.paginated(res, result.invoices, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, invoice);
});

const create = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, invoice, 'Invoice created successfully');
});

const update = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, invoice, 'Invoice updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, invoice, 'Invoice approved successfully');
});

const recordPayment = asyncHandler(async (req, res) => {
  const payment = await invoiceService.recordPayment(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, payment, 'Payment recorded successfully');
});

const cancel = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.cancel(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, invoice, 'Invoice cancelled');
});

const remove = asyncHandler(async (req, res) => {
  await invoiceService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Invoice deleted');
});

const getStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await invoiceService.getInvoiceStatistics(req.tenant.id, { startDate, endDate });
  return ApiResponse.success(res, stats);
});

module.exports = { getAll, getById, create, update, approve, recordPayment, cancel, remove, getStatistics };
