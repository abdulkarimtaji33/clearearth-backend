/**
 * Tenant Controller - Company/organization settings for the current tenant
 */
const tenantService = require('../services/tenant.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getMyTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getById(req.tenant.id);
  return ApiResponse.success(res, tenant);
});

const updateMyTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.update(req.tenant.id, req.body);
  return ApiResponse.success(res, tenant, 'Company settings updated successfully');
});

module.exports = { getMyTenant, updateMyTenant };
