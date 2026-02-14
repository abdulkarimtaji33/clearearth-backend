const certificateService = require('../services/certificate.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, certificateType, clientId, jobId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await certificateService.getAll(req.tenant.id, { ...pagination, search, certificateType, clientId, jobId });
  return ApiResponse.paginated(res, result.certificates, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, certificate);
});

const create = asyncHandler(async (req, res) => {
  const certificate = await certificateService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, certificate, 'Certificate created successfully');
});

const verify = asyncHandler(async (req, res) => {
  const certificate = await certificateService.verify(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, certificate, 'Certificate verified');
});

const remove = asyncHandler(async (req, res) => {
  await certificateService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Certificate deleted');
});

const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await certificateService.getAllTemplates(req.tenant.id);
  return ApiResponse.success(res, templates);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await certificateService.getTemplateById(req.tenant.id, req.params.templateId);
  return ApiResponse.success(res, template);
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await certificateService.createTemplate(req.tenant.id, req.body);
  return ApiResponse.created(res, template, 'Template created successfully');
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await certificateService.updateTemplate(req.tenant.id, req.params.templateId, req.body);
  return ApiResponse.success(res, template, 'Template updated successfully');
});

module.exports = { getAll, getById, create, verify, remove, getAllTemplates, getTemplateById, createTemplate, updateTemplate };
