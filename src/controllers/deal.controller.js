const dealService = require('../services/deal.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const { shouldHideDealFinancials, sanitizeDealPayload } = require('../utils/dealFinancials');

const hideFinancialsForUser = (req) => shouldHideDealFinancials(req.user);

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req, 'deals');
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
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)));
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.create(req.tenant.id, req.body, scope, req.user);
  return ApiResponse.created(res, deal, 'Deal created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.update(req.tenant.id, req.params.id, req.body, scope, req.user);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Deal updated successfully');
});

const updatePayment = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.updatePayment(req.tenant.id, req.params.id, req.body.paidAmount, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Payment updated successfully');
});

const updateCollectionDetails = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.updateCollectionDetails(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Collection details updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  await dealService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Deal deleted');
});

const saveInspectionReport = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.saveInspectionReport(req.tenant.id, req.params.id, req.body, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Inspection report saved');
});

const approve = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.approve(req.tenant.id, req.params.id, scope, {
    userId: req.user.id,
    roleName: req.user.role?.name,
  });
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Deal approved');
});

const requestApproval = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
  const deal = await dealService.requestApproval(req.tenant.id, req.params.id, scope, req.user);
  return ApiResponse.success(res, sanitizeDealPayload(deal, hideFinancialsForUser(req)), 'Approval requested');
});

const approveWithPin = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req, 'deals');
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
  approve,
  requestApproval,
  approveWithPin,
};
