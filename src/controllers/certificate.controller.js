const certificateService = require('../services/certificate.service');
const certificatePdfService = require('../services/certificatePdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

// ---- Certificate Requests ----

const listRequests = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const requestedBy = req.query.mine === 'true' ? req.user.id : undefined;
  const result = await certificateService.listRequests(req.tenant.id, { ...pagination, search, status, requestedBy });
  return ApiResponse.paginated(res, result.requests, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getRequestById = asyncHandler(async (req, res) => {
  const row = await certificateService.getRequestById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const createRequest = asyncHandler(async (req, res) => {
  const row = await certificateService.createRequest(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Certificate request created');
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const row = await certificateService.addAttachments(req.tenant.id, req.params.id, req.body.attachments || []);
  return ApiResponse.success(res, row, 'Attachments added');
});

const verifyRequest = asyncHandler(async (req, res) => {
  const row = await certificateService.verifyRequest(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, row, 'Certificate request verified');
});

const generate = asyncHandler(async (req, res) => {
  const row = await certificateService.generateCertificate(req.tenant.id, req.user.id, req.params.id, req.body.types || []);
  return ApiResponse.success(res, row, 'Certificate(s) generated');
});

// ---- Certificates (register) ----

const listCertificates = asyncHandler(async (req, res) => {
  const { page, pageSize, search, type, status, from, to } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await certificateService.listCertificates(req.tenant.id, { ...pagination, search, type, status, from, to });
  return ApiResponse.paginated(res, result.certificates, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const row = await certificateService.getCertificateById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const getPdf = asyncHandler(async (req, res) => {
  const cert = await certificateService.getCertificateById(req.tenant.id, req.params.id);
  const raw = await certificatePdfService.generateCertificatePdf(req.tenant.id, req.params.id);
  if (!raw || (!Buffer.isBuffer(raw) && !(raw instanceof Uint8Array))) {
    return ApiResponse.error(res, 'Certificate not found or PDF generation failed', 404);
  }
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `certificate-${cert.certificate_number || req.params.id}.pdf`.replace(/[^\w.-]+/g, '_');
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

// ---- Carbon footprint factors (Settings CRUD) ----

const listCarbonFactors = asyncHandler(async (req, res) => {
  const rows = await certificateService.listCarbonFactors(req.tenant.id);
  return ApiResponse.success(res, rows);
});

const upsertCarbonFactor = asyncHandler(async (req, res) => {
  const row = await certificateService.upsertCarbonFactor(req.tenant.id, req.body);
  return ApiResponse.success(res, row, 'Carbon footprint factor saved');
});

module.exports = {
  listRequests,
  getRequestById,
  createRequest,
  uploadAttachment,
  verifyRequest,
  generate,
  listCertificates,
  getCertificateById,
  getPdf,
  listCarbonFactors,
  upsertCarbonFactor,
};
