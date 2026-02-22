/**
 * Supplier Controller
 */
const supplierService = require('../services/supplier.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await supplierService.getAll(req.tenant.id, { ...pagination, search, status });

  return ApiResponse.paginated(res, result.suppliers, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, supplier);
});

const create = asyncHandler(async (req, res) => {
  const supplier = await supplierService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, supplier, 'Supplier created successfully');
});

const update = asyncHandler(async (req, res) => {
  const supplier = await supplierService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, supplier, 'Supplier updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await supplierService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Supplier deleted successfully');
});

const addContact = asyncHandler(async (req, res) => {
  const { contactId, role, isPrimary } = req.body;
  const supplier = await supplierService.addContact(
    req.tenant.id, req.params.id, contactId, role, isPrimary
  );
  return ApiResponse.success(res, supplier, 'Contact added to supplier');
});

const removeContact = asyncHandler(async (req, res) => {
  const supplier = await supplierService.removeContact(
    req.tenant.id, req.params.id, req.params.contactId
  );
  return ApiResponse.success(res, supplier, 'Contact removed from supplier');
});

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
