const path = require('path');
const config = require('../config');
const grnService = require('../services/grn.service');
const pdfService = require('../services/pdf.service');
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

const uploadItemImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const images = files.map((f) => {
    const relativePath = path.relative(config.upload.path, f.path).replace(/\\/g, '/');
    return {
      imageUrl: getFileUrl(relativePath),
      originalName: f.originalname,
    };
  });
  const row = await grnService.addItemImages(req.tenant.id, req.params.id, req.params.itemId, images);
  return ApiResponse.success(res, row, 'Images uploaded');
});

const approve = asyncHandler(async (req, res) => {
  const row = await grnService.approveGrn(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, row, 'GRN approved and inventory updated');
});

const getPdf = asyncHandler(async (req, res) => {
  const grn = await grnService.getById(req.tenant.id, req.params.id);
  const raw = await pdfService.generateGrnPdf(req.params.id, req.tenant.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'GRN not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `grn-${grn.grn_number || req.params.id}.pdf`.replace(/[^\w.-]+/g, '_');
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

module.exports = { list, getById, create, update, uploadItemImages, approve, getPdf };
