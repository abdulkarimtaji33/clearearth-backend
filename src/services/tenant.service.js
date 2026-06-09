/**
 * Tenant Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { isLeadApprovalPinConfigured } = require('../utils/leadApproval');

const sanitizeTenant = (tenant) => {
  const json = tenant.toJSON ? tenant.toJSON() : { ...tenant };
  const settings = { ...(json.settings || {}) };
  delete settings.leadApprovalPinHash;
  json.settings = settings;
  return json;
};

const getById = async (tenantId) => {
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Tenant not found');
  const pinConfigured = await isLeadApprovalPinConfigured(tenantId);
  const json = sanitizeTenant(tenant);
  json.lead_approval_pin_configured = pinConfigured;
  return json;
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

const updateLeadApprovalPin = async (tenantId, pin) => {
  const { setLeadApprovalPin } = require('../utils/leadApproval');
  await setLeadApprovalPin(tenantId, pin);
  return getById(tenantId);
};

module.exports = { getById, update, updateLeadApprovalPin };
