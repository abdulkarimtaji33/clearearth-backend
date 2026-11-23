const pickupRequestService = require('../services/pickupRequest.service');
const quotationService = require('../services/quotation.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const ApiError = require('../utils/apiError');
const {
  shouldHideDealFinancials,
  sanitizeQuotationListItem,
  assertCanModifyQuotationsAndOrders,
} = require('../utils/dealFinancials');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, statusNot, dealId, dateFrom, dateTo, hasWorkOrder } = req.query;
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
    hasWorkOrder: hasWorkOrder === 'true' ? true : hasWorkOrder === 'false' ? false : undefined,
    ...scope,
  });
  const hideFinancials = shouldHideDealFinancials(req);
  const quotations = hideFinancials
    ? result.quotations.map((q) => sanitizeQuotationListItem(q, true))
    : result.quotations;
  return ApiResponse.paginated(res, quotations, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.getById(req.tenant.id, req.params.id, scope);
  const hideFinancials = shouldHideDealFinancials(req);
  return ApiResponse.success(res, sanitizeQuotationListItem(quotation, hideFinancials));
});

const create = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const quotation = await quotationService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, quotation, 'Quotation created successfully');
});

const update = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const quotation = await quotationService.update(req.tenant.id, req.params.id, req.body, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  });
  return ApiResponse.success(res, quotation, 'Quotation updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  await quotationService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Quotation deleted');
});

const approve = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const quotation = await quotationService.approve(req.tenant.id, req.params.id, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, req.body.requestedPickupDate || null);
  await quotationService.setPickupRequestNote(req.tenant.id, req.params.id, req.body.pickupRequestNote);
  await pickupRequestService.save(req.tenant.id, 'quotation', req.params.id, req.body.pickupRequest, req.user.id);
  const hideFinancials = shouldHideDealFinancials(req);
  return ApiResponse.success(res, sanitizeQuotationListItem(quotation, hideFinancials), 'Quotation approved');
});

const confirmPickupDate = asyncHandler(async (req, res) => {
  const quotation = await quotationService.confirmPickupDate(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  });
  return ApiResponse.success(res, quotation, 'Pickup date confirmed');
});

const requestPickupReschedule = asyncHandler(async (req, res) => {
  const quotation = await quotationService.requestPickupReschedule(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, req.body.note || null);
  return ApiResponse.success(res, quotation, 'Reschedule requested');
});

const reschedulePickupDate = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const quotation = await quotationService.reschedulePickupDate(req.tenant.id, req.params.id, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, req.body.pickupDate);
  return ApiResponse.success(res, quotation, 'Pickup date rescheduled');
});

const requestApproval = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const quotation = await quotationService.requestApproval(req.tenant.id, req.params.id, scope, req.user, req.body.requestedPickupDate);
  await quotationService.setPickupRequestNote(req.tenant.id, req.params.id, req.body.pickupRequestNote);
  await pickupRequestService.save(req.tenant.id, 'quotation', req.params.id, req.body.pickupRequest, req.user.id);
  const hideFinancials = shouldHideDealFinancials(req);
  return ApiResponse.success(res, sanitizeQuotationListItem(quotation, hideFinancials), 'Approval requested');
});

const getPdf = asyncHandler(async (req, res) => {
  if (shouldHideDealFinancials(req)) {
    throw ApiError.forbidden('Operations managers cannot download quotation or order PDFs with pricing.');
  }
  const scope = getSalesScope(req);
  const quotation = await quotationService.getById(req.tenant.id, req.params.id, scope);
  const variant = String(req.query.documentType || req.query.variant || '').toLowerCase();
  const pdfOptions = {};
  if (variant === 'quotation' || variant === 'quote') pdfOptions.documentType = 'quotation';
  else if (variant === 'order') pdfOptions.documentType = 'order';
  const raw = await pdfService.generateQuotationPdf(req.params.id, req.tenant.id, pdfOptions);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Quotation not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const isOrder = pdfOptions.documentType === 'order'
    || (pdfOptions.documentType !== 'quotation' && String(quotation?.status || '').toLowerCase() === 'approved');
  const fname = isOrder ? `service-order-${req.params.id}.pdf` : `service-quotation-${req.params.id}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

const getPickupRequest = asyncHandler(async (req, res) => {
  const data = await pickupRequestService.getBySource(req.tenant.id, 'quotation', req.params.id);
  return ApiResponse.success(res, data, 'Pickup request');
});

const getPickupRequestPrefill = asyncHandler(async (req, res) => {
  const data = await pickupRequestService.prefill(req.tenant.id, 'quotation', req.params.id, req.user);
  return ApiResponse.success(res, data, 'Pickup request defaults');
});

module.exports = {
  getPickupRequest,
  getPickupRequestPrefill,
  getAll,
  getById,
  create,
  update,
  remove,
  approve,
  requestApproval,
  confirmPickupDate,
  requestPickupReschedule,
  reschedulePickupDate,
  getPdf,
};
