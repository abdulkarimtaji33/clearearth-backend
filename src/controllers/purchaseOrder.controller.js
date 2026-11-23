const pickupRequestService = require('../services/pickupRequest.service');
const purchaseOrderService = require('../services/purchaseOrder.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const {
  shouldHideDealFinancials,
  sanitizePurchaseOrderPayload,
  assertCanModifyQuotationsAndOrders,
} = require('../utils/dealFinancials');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, supplierId, companyId, dealId, status, statusNot, side, dateFrom, dateTo, hasWorkOrder } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await purchaseOrderService.getAll(req.tenant.id, {
    ...pagination,
    search,
    supplierId,
    companyId,
    dealId,
    status,
    statusNot,
    side,
    dateFrom,
    dateTo,
    hasWorkOrder: hasWorkOrder === 'true' ? true : hasWorkOrder === 'false' ? false : undefined,
    ...scope,
  });
  const hideFinancials = shouldHideDealFinancials(req);
  const purchaseOrders = hideFinancials
    ? result.purchaseOrders.map((po) => sanitizePurchaseOrderPayload(po, true))
    : result.purchaseOrders;
  return ApiResponse.paginated(res, purchaseOrders, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.getById(req.tenant.id, req.params.id, scope);
  const hideFinancials = shouldHideDealFinancials(req);
  return ApiResponse.success(res, sanitizePurchaseOrderPayload(po, hideFinancials));
});

const create = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, po, 'Purchase order created successfully');
});

const update = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.update(req.tenant.id, req.params.id, req.body, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, scope);
  return ApiResponse.success(res, po, 'Purchase order updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.approve(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, scope, req.body.requestedPickupDate || null);
  await purchaseOrderService.setPickupRequestNote(req.tenant.id, req.params.id, req.body.pickupRequestNote);
  await pickupRequestService.save(req.tenant.id, 'purchase_order', req.params.id, req.body.pickupRequest, req.user.id);
  return ApiResponse.success(res, po, 'Purchase quotation approved');
});

const confirmPickupDate = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.confirmPickupDate(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  });
  return ApiResponse.success(res, po, 'Pickup date confirmed');
});

const requestPickupReschedule = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.requestPickupReschedule(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, req.body.note || null);
  return ApiResponse.success(res, po, 'Reschedule requested');
});

const reschedulePickupDate = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.reschedulePickupDate(req.tenant.id, req.params.id, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name, access: req.access,
  }, req.body.pickupDate);
  return ApiResponse.success(res, po, 'Pickup date rescheduled');
});

const requestApproval = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.requestApproval(req.tenant.id, req.params.id, req.user, scope, req.body.requestedPickupDate);
  await purchaseOrderService.setPickupRequestNote(req.tenant.id, req.params.id, req.body.pickupRequestNote);
  await pickupRequestService.save(req.tenant.id, 'purchase_order', req.params.id, req.body.pickupRequest, req.user.id);
  return ApiResponse.success(res, po, 'Approval requested');
});

const remove = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req);
  const scope = getSalesScope(req);
  await purchaseOrderService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Purchase order deleted');
});

const getPdf = asyncHandler(async (req, res) => {
  if (shouldHideDealFinancials(req)) {
    throw ApiError.forbidden('Operations managers cannot download quotation or order PDFs with pricing.');
  }
  const scope = getSalesScope(req);
  const po = await purchaseOrderService.getById(req.tenant.id, req.params.id, scope);
  const variant = String(req.query.documentType || req.query.variant || '').toLowerCase();
  const pdfOptions = {};
  if (variant === 'quotation' || variant === 'quote') pdfOptions.documentType = 'quotation';
  else if (variant === 'order') pdfOptions.documentType = 'order';
  const raw = await pdfService.generatePurchaseOrderPdf(req.params.id, req.tenant.id, pdfOptions);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Purchase order not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const isBill = String(po?.document_type || '').toLowerCase() === 'bill';
  const isOrder = isBill
    || pdfOptions.documentType === 'order'
    || (pdfOptions.documentType !== 'quotation' && String(po?.status || '').toLowerCase() === 'approved');
  const fname = isBill
    ? `purchase-bill-${req.params.id}.pdf`
    : (isOrder ? `purchase-order-${req.params.id}.pdf` : `purchase-quotation-${req.params.id}.pdf`);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

const getPickupRequest = asyncHandler(async (req, res) => {
  const data = await pickupRequestService.getBySource(req.tenant.id, 'purchase_order', req.params.id);
  return ApiResponse.success(res, data, 'Pickup request');
});

const getPickupRequestPrefill = asyncHandler(async (req, res) => {
  const data = await pickupRequestService.prefill(req.tenant.id, 'purchase_order', req.params.id, req.user);
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
  getPdf,
  approve,
  requestApproval,
  confirmPickupDate,
  requestPickupReschedule,
  reschedulePickupDate,
};
