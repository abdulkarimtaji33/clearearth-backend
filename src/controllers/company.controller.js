/**
 * Company Controller
 */
const companyService = require('../services/company.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { getSalesScope } = require('../utils/scopeHelper');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, industryType, country, city, contactId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const scope = getSalesScope(req);

  const result = await companyService.getAll(req.tenant.id, { ...pagination, search, status, industryType, country, city, contactId, ...scope });

  return ApiResponse.paginated(res, result.companies, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const company = await companyService.getById(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, company);
});

const create = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const company = await companyService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, company, 'Company created successfully');
});

const update = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const company = await companyService.update(req.tenant.id, req.params.id, req.body, scope);
  return ApiResponse.success(res, company, 'Company updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  await companyService.remove(req.tenant.id, req.params.id, scope);
  return ApiResponse.success(res, null, 'Company deleted successfully');
});

const addContact = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const { contactId, role, isPrimary } = req.body;
  const company = await companyService.addContact(
    req.tenant.id, req.params.id, contactId, role, isPrimary, scope
  );
  return ApiResponse.success(res, company, 'Contact added to company');
});

const removeContact = asyncHandler(async (req, res) => {
  const scope = getSalesScope(req);
  const company = await companyService.removeContact(
    req.tenant.id, req.params.id, req.params.contactId, scope
  );
  return ApiResponse.success(res, company, 'Contact removed from company');
});

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
