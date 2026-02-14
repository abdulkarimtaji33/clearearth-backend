const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, paymentType, paymentMethod, clientId, vendorId, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await paymentService.getAll(req.tenant.id, { ...pagination, paymentType, paymentMethod, clientId, vendorId, startDate, endDate });
  return ApiResponse.paginated(res, result.payments, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, payment);
});

const create = asyncHandler(async (req, res) => {
  const payment = await paymentService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, payment, 'Payment created successfully');
});

const updateChequeStatus = asyncHandler(async (req, res) => {
  const cheque = await paymentService.updateChequeStatus(req.tenant.id, req.params.chequeId, req.body.status, req.body);
  return ApiResponse.success(res, cheque, 'Cheque status updated');
});

const getPostDatedCheques = asyncHandler(async (req, res) => {
  const cheques = await paymentService.getPostDatedCheques(req.tenant.id);
  return ApiResponse.success(res, cheques);
});

const remove = asyncHandler(async (req, res) => {
  await paymentService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Payment deleted');
});

module.exports = { getAll, getById, create, updateChequeStatus, getPostDatedCheques, remove };
