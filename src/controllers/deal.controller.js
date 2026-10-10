const dealService = require('../services/deal.service');
const inspectionReportPdfService = require('../services/inspectionReportPdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const { shouldHideDealFinancials, sanitizeDealPayload } = require('../utils/dealFinancials');

const hideFinancialsForUser = (req) => shouldHideDealFinancials(req.user?.role?.name);

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);
  const result = await dealService.getAll(req.tenant.id, { 
    ...pagination, 
    search, 
    status, 
    paymentStatus, 
    companyId, 
    supplierId,
    contactId,
    assignedTo,
    productServiceId,
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
    ...scope,
  });
  const hideFinancials = hideFinancialsForUser(req);
  const deals = hideFinancials
    ? result.deals.map((d) => sanitizeDealPayload(d, true))
    : result.deals;
  return ApiResponse.paginated(res, deals, { 
    page: pagination.page, 
    pageSize: pagination.pageSize, 
    totalItems: result.total 
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)));
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.create(req.tenant.id, req.body, scope, req.user);
  return ApiResponse.created(res, deal, 'Deal created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.update(req.tenant.id, req.params.id, req.body, scope, req.user);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Deal updated successfully');
});

const updatePayment = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.updatePayment(req.tenant.id, req.params.id, req.body.paidAmount, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Payment updated successfully');
});

const updateCollectionDetails = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.updateCollectionDetails(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Collection details updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await dealService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Deal deleted');
});

const saveInspectionReport = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.saveInspectionReport(req.tenant.id, req.params.id, req.body, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Inspection report saved');
});

const getInspectionReportPdf = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  // Reuse the same deal scoping as getById so a scoped sales user can only pull the
  // PDF for a deal they can already see, then re-check it exists before touching Puppeteer.
  const deal = await dealService.getById(req.tenant.id, req.params.id, scope);
  if (!deal || !deal.inspectionReport) {
    return ApiResponse.error(res, 'Inspection report not found', 404);
  }
  const raw = await inspectionReportPdfService.generateInspectionReportPdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Inspection report not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `inspection-report-${deal.deal_number || req.params.id}.pdf`.replace(/[^\w.-]+/g, '_');
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

const approve = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.approve(req.tenant.id, req.params.id, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Deal approved');
});

const requestApproval = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.requestApproval(req.tenant.id, req.params.id, scope, req.user);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Approval requested');
});

const approveWithPin = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.approveWithPin(req.tenant.id, req.params.id, req.body.pin, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Deal approved');
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePayment,
  updateCollectionDetails,
  remove,
  saveInspectionReport,
  getInspectionReportPdf,
  approve,
  requestApproval,
  approveWithPin,
};
