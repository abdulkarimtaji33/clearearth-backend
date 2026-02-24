const dealService = require('../services/deal.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount } = req.query;
  const pagination = getPaginationParams(page, pageSize);
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
    maxAmount
  });
  return ApiResponse.paginated(res, result.deals, { 
    page: pagination.page, 
    pageSize: pagination.pageSize, 
    totalItems: result.total 
  });
});

const getById = asyncHandler(async (req, res) => {
  const deal = await dealService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, deal);
});

const create = asyncHandler(async (req, res) => {
  const deal = await dealService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, deal, 'Deal created successfully');
});

const update = asyncHandler(async (req, res) => {
  const deal = await dealService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, deal, 'Deal updated successfully');
});

const updatePayment = asyncHandler(async (req, res) => {
  const deal = await dealService.updatePayment(req.tenant.id, req.params.id, req.body.paidAmount);
  return ApiResponse.success(res, deal, 'Payment updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await dealService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Deal deleted');
});

module.exports = { getAll, getById, create, update, updatePayment, remove };
