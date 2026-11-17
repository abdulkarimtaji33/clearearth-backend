/**
 * Generic controller factory for the employee child-record entities
 * (emergency contacts, dependents, qualifications, skills, certifications,
 * previous employment, documents). Used to build both the HR-side
 * (/hr/employees/:employeeId/<entity>) and self-service
 * (/hr/employees/me/<entity>) route handlers from the same service layer.
 */
const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

/** resolveEmployeeId: (req) => Promise<employeeId> — either req.params.employeeId (HR) or the caller's own record (self-service) */
/** Copies uploaded file paths (single `file`, or `file` + `fileBack` from fields upload) onto the body. */
function applyUploadedFiles(req, body) {
  const path = require('path');
  const config = require('../config');
  const { getFileUrl } = require('../middlewares/upload');
  const rel = (f) => path.relative(config.upload.path, f.path).replace(/\\/g, '/');
  const front = req.file || req.files?.file?.[0];
  const back = req.files?.fileBack?.[0];
  if (front) {
    body.filePath = rel(front);
    body._fileUrl = getFileUrl(body.filePath);
  }
  if (back) body.filePathBack = rel(back);
}

function makeChildRecordController(service, resolveEmployeeId) {
  const list = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const rows = await service.list(req.tenant.id, employeeId);
    return ApiResponse.success(res, rows);
  });

  const create = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const body = { ...req.body };
    applyUploadedFiles(req, body);
    const row = await service.create(req.tenant.id, employeeId, body);
    return ApiResponse.created(res, row);
  });

  const update = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const body = { ...req.body };
    applyUploadedFiles(req, body);
    const row = await service.update(req.tenant.id, employeeId, req.params.id, body);
    return ApiResponse.success(res, row);
  });

  const remove = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    await service.remove(req.tenant.id, employeeId, req.params.id);
    return ApiResponse.success(res, null, 'Deleted successfully');
  });

  return { list, create, update, remove };
}

const hrEmployeeIdResolver = (req) => Promise.resolve(req.params.employeeId);
const selfEmployeeIdResolver = async (req) => {
  const employee = await employeeService.requireEmployeeForUser(req.tenant.id, req.user.id);
  return employee.id;
};

module.exports = { makeChildRecordController, hrEmployeeIdResolver, selfEmployeeIdResolver };
