/**
 * Tenant Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

const getById = async (tenantId) => {
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Tenant not found');
  return tenant;
};

const update = async (tenantId, data) => {
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Tenant not found');

  const allowed = [
    'name',
    'company_name',
    'email',
    'phone',
    'address',
    'city',
    'country',
    'trn_number',
    'vat_registration_number',
    'license_number',
  ];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  if (Object.keys(updates).length === 0) return tenant;

  await tenant.update(updates);
  return tenant;
};

module.exports = { getById, update };
