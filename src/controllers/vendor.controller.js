/**
 * Vendor Controller
 */
const vendorService = require('../services/vendor.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, vendorType } = req.query;
  const pagination = getPaginationParams(page, pageSize);

  const result = await vendorService.getAll(req.tenant.id, {
    ...pagination,
    search,
    status,
    vendorType,
  });

  return ApiResponse.paginated(res, result.vendors, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, vendor);
});

const create = asyncHandler(async (req, res) => {
  const vendor = await vendorService.create(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, vendor, 'Vendor created successfully');
});

const update = asyncHandler(async (req, res) => {
  const vendor = await vendorService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, vendor, 'Vendor updated successfully');
});

const approve = asyncHandler(async (req, res) => {
  const vendor = await vendorService.approve(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, vendor, 'Vendor approved successfully');
});

const deactivate = asyncHandler(async (req, res) => {
  const vendor = await vendorService.deactivate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, vendor, 'Vendor deactivated successfully');
});

const activate = asyncHandler(async (req, res) => {
  const vendor = await vendorService.activate(req.tenant.id, req.params.id);
  return ApiResponse.success(res, vendor, 'Vendor activated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await vendorService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Vendor deleted successfully');
});

module.exports = { getAll, getById, create, update, approve, deactivate, activate, remove };
