/**
 * Contact Controller
 */
const contactService = require('../services/contact.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');
const { departmentOfRequest } = require('../utils/roleAccess');

// Operations users only see and manage the contacts they created; every new contact records its creator.
const contactScope = (req) => (
  departmentOfRequest(req) === 'operations'
    ? { createdOnlyBy: req.user.id, creatorId: req.user.id }
    : { ...getSalesScope(req), creatorId: req.user?.id }
);

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, designation, department, companyId, supplierId, contactType, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = contactScope(req);

  const result = await contactService.getAll(req.tenant.id, { ...pagination, search, status, designation, department, companyId, supplierId, contactType, dateFrom, dateTo, ...scope });

  return ApiResponse.paginated(res, result.contacts, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = contactScope(req);
  const contact = await contactService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, contact);
});

const create = asyncHandler(async (req, res) => {
  const scope = contactScope(req);
  const contact = await contactService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, contact, 'Contact created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = contactScope(req);
  const contact = await contactService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, contact, 'Contact updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = contactScope(req);
  await contactService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Contact deleted successfully');
});

module.exports = { getAll, getById, create, update, remove };
