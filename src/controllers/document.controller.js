const documentService = require('../services/document.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { uploadSingle } = require('../middlewares/upload');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, documentType, referenceType, referenceId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await documentService.getAll(req.tenant.id, { ...pagination, search, documentType, referenceType, referenceId });
  return ApiResponse.paginated(res, result.documents, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const document = await documentService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, document);
});

const create = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File is required');
  const document = await documentService.create(req.tenant.id, req.user.id, req.body, req.file);
  return ApiResponse.created(res, document, 'Document uploaded successfully');
});

const createVersion = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File is required');
  const document = await documentService.createVersion(req.tenant.id, req.user.id, req.params.id, req.file, req.body.description);
  return ApiResponse.created(res, document, 'New version created');
});

const update = asyncHandler(async (req, res) => {
  const document = await documentService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, document, 'Document updated successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const document = await documentService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, document, 'Document deactivated');
});

const remove = asyncHandler(async (req, res) => {
  await documentService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Document deleted');
});

module.exports = { getAll, getById, create, createVersion, update, deactivate, remove };
