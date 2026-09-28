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
function makeChildRecordController(service, resolveEmployeeId) {
  const list = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const rows = await service.list(req.tenant.id, employeeId);
    return ApiResponse.success(res, rows);
  });

  const create = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const body = { ...req.body };
    if (req.file) {
      const { getFileUrl } = require('../middlewares/upload');
      const path = require('path');
      const config = require('../config');
      body.filePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
      body._fileUrl = getFileUrl(body.filePath);
    }
    const row = await service.create(req.tenant.id, employeeId, body);
    return ApiResponse.created(res, row);
  });

  const update = asyncHandler(async (req, res) => {
    const employeeId = await resolveEmployeeId(req);
    const row = await service.update(req.tenant.id, employeeId, req.params.id, req.body);
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
