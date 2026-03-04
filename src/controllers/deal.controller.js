const dealService = require('../services/deal.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount } = req.query;
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
    ...scope,
  });
  return ApiResponse.paginated(res, result.deals, { 
    page: pagination.page, 
    pageSize: pagination.pageSize, 
    totalItems: result.total 
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, deal);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, deal, 'Deal created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, deal, 'Deal updated successfully');
});

const updatePayment = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.updatePayment(req.tenant.id, req.params.id, req.body.paidAmount, scope);
  return ApiResponse.success(res, deal, 'Payment updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await dealService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Deal deleted');
});

const saveInspectionReport = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const deal = await dealService.saveInspectionReport(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, deal, 'Inspection report saved');
});

module.exports = { getAll, getById, create, update, updatePayment, remove, saveInspectionReport };
