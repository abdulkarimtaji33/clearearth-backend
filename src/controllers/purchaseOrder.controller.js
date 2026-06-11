const purchaseOrderService = require('../services/purchaseOrder.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const {
  shouldHideDealFinancials,
  sanitizePurchaseOrderPayload,
  assertCanModifyQuotationsAndOrders,
} = require('../utils/dealFinancials');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, supplierId, companyId, dealId, status, statusNot, side, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
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
  });
  const hideFinancials = shouldHideDealFinancials(req.user?.role?.name);
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
  const po = await purchaseOrderService.getById(req.tenant.id, req.params.id);
  const hideFinancials = shouldHideDealFinancials(req.user?.role?.name);
  return ApiResponse.success(res, sanitizePurchaseOrderPayload(po, hideFinancials));
});

const create = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  const po = await purchaseOrderService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, po, 'Purchase order created successfully');
});

const update = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  const po = await purchaseOrderService.update(req.tenant.id, req.params.id, req.body, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, po, 'Purchase order updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  const po = await purchaseOrderService.approve(req.tenant.id, req.params.id, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, po, 'Purchase quotation approved');
});

const requestApproval = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  const po = await purchaseOrderService.requestApproval(req.tenant.id, req.params.id, req.user);
  return ApiResponse.success(res, po, 'Approval requested');
});

const approveWithPin = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  const po = await purchaseOrderService.approveWithPin(req.tenant.id, req.params.id, req.body.pin, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, po, 'Purchase quotation approved');
});

const remove = asyncHandler(async (req, res) => {
  assertCanModifyQuotationsAndOrders(req.user?.role?.name);
  await purchaseOrderService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Purchase order deleted');
});

const getPdf = asyncHandler(async (req, res) => {
  if (shouldHideDealFinancials(req.user?.role?.name)) {
    throw ApiError.forbidden('Operations managers cannot download quotation or order PDFs with pricing.');
  }
  const po = await purchaseOrderService.getById(req.tenant.id, req.params.id);
  const raw = await pdfService.generatePurchaseOrderPdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Purchase order not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const isOrder = String(po?.status || '').toLowerCase() === 'approved';
  const fname = isOrder ? `purchase-order-${req.params.id}.pdf` : `purchase-quotation-${req.params.id}.pdf`;
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getPdf,
  approve,
  requestApproval,
  approveWithPin,
};
