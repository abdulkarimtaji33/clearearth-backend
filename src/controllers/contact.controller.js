/**
 * Contact Controller
 */
const contactService = require('../services/contact.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, designation, department, companyId, contactType } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);

  const result = await contactService.getAll(req.tenant.id, { ...pagination, search, status, designation, department, companyId, contactType, ...scope });

  return ApiResponse.paginated(res, result.contacts, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const contact = await contactService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, contact);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const contact = await contactService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, contact, 'Contact created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const contact = await contactService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, contact, 'Contact updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await contactService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Contact deleted successfully');
});

module.exports = { getAll, getById, create, update, remove };
