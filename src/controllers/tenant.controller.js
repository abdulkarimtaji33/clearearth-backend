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

// Public — no auth needed, returns only the logo path
const getPublicLogo = asyncHandler(async (req, res) => {
  // Use first tenant (single-tenant deployment) or derive from host
  const db = require('../models');
  const tenant = await db.Tenant.findOne({ attributes: ['logo'] });
  return ApiResponse.success(res, { logo: tenant?.logo || null });
});

const updateMyTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.update(req.tenant.id, req.body);
  return ApiResponse.success(res, tenant, 'Company settings updated successfully');
});

module.exports = { getMyTenant, updateMyTenant, getPublicLogo };
