const outboundService = require('../services/outbound.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAllOutbound = asyncHandler(async (req, res) => {
  const { page, pageSize, status, lotId, clientId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await outboundService.getAllOutbound(req.tenant.id, { ...pagination, status, lotId, clientId });
  return ApiResponse.paginated(res, result.outbounds, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getOutboundById = asyncHandler(async (req, res) => {
  const outbound = await outboundService.getOutboundById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, outbound);
});

const createOutbound = asyncHandler(async (req, res) => {
  const outbound = await outboundService.createOutbound(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, outbound, 'Outbound created successfully');
});

const confirmDispatch = asyncHandler(async (req, res) => {
  const outbound = await outboundService.confirmDispatch(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, outbound, 'Dispatch confirmed');
});

const completeDelivery = asyncHandler(async (req, res) => {
  const outbound = await outboundService.completeDelivery(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, outbound, 'Delivery completed');
});

module.exports = { getAllOutbound, getOutboundById, createOutbound, confirmDispatch, completeDelivery };
