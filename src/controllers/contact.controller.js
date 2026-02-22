/**
 * Contact Controller
 */
const contactService = require('../services/contact.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await contactService.getAll(req.tenant.id, { ...pagination, search, status });

  return ApiResponse.paginated(res, result.contacts, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const contact = await contactService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, contact);
});

const create = asyncHandler(async (req, res) => {
  const contact = await contactService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, contact, 'Contact created successfully');
});

const update = asyncHandler(async (req, res) => {
  const contact = await contactService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, contact, 'Contact updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await contactService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Contact deleted successfully');
});

module.exports = { getAll, getById, create, update, remove };
