const path = require('path');
const config = require('../config');
const grnService = require('../services/grn.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getFileUrl } = require('../middlewares/upload');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, workOrderId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await grnService.listGrns(req.tenant.id, {
    ...pagination,
    search,
    status,
    workOrderId,
  });
  return ApiResponse.paginated(res, result.grns, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const row = await grnService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const row = await grnService.createGrn(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'GRN created');
});

const update = asyncHandler(async (req, res) => {
  const row = await grnService.updateGrn(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, row, 'GRN updated');
});

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const images = files.map((f) => {
    const relativePath = path.relative(config.upload.path, f.path).replace(/\\/g, '/');
    return {
      imageUrl: getFileUrl(relativePath),
      originalName: f.originalname,
    };
  });
  const row = await grnService.addImages(req.tenant.id, req.params.id, images);
  return ApiResponse.success(res, row, 'Images uploaded');
});

const approve = asyncHandler(async (req, res) => {
  const row = await grnService.approveGrn(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, row, 'GRN approved and inventory updated');
});

module.exports = { list, getById, create, update, uploadImages, approve };
