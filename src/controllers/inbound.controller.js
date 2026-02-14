const inboundService = require('../services/inbound.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAllGRNs = asyncHandler(async (req, res) => {
  const { page, pageSize, status, dealId, vendorId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await inboundService.getAllGRNs(req.tenant.id, { ...pagination, status, dealId, vendorId });
  return ApiResponse.paginated(res, result.grns, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getGRNById = asyncHandler(async (req, res) => {
  const grn = await inboundService.getGRNById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, grn);
});

const createGRN = asyncHandler(async (req, res) => {
  const grn = await inboundService.createGRN(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, grn, 'GRN created successfully');
});

const approveGRN = asyncHandler(async (req, res) => {
  const grn = await inboundService.approveGRN(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, grn, 'GRN approved and lot created');
});

const rejectGRN = asyncHandler(async (req, res) => {
  const grn = await inboundService.rejectGRN(req.tenant.id, req.params.id, req.user.id, req.body.reason);
  return ApiResponse.success(res, grn, 'GRN rejected');
});

module.exports = { getAllGRNs, getGRNById, createGRN, approveGRN, rejectGRN };
