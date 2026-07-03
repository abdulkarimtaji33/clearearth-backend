/**
 * Lead approval PIN and manager helpers
 */
const db = require('../models');
const { Op } = db.Sequelize;
const { hashPassword, comparePassword } = require('./helpers');
const { parseTenantSettings, cleanTenantSettings } = require('./tenantSettings');

const PIN_SETTINGS_KEY = 'leadApprovalPinHash';

/**
 * Approval authority is driven by holding `${module}.approve` (defaults to
 * 'leads' for backward-compat callers). Accepts an actor object carrying
 * either `hasPermission` (preferred, from req.user) or a legacy `roleName`.
 */
const isManagerRole = (actor, module = 'leads') => {
  if (!actor) return false;
  if (typeof actor === 'string') return false; // legacy bare role-name string: fail closed, permission-based only now
  if (actor.roleName === 'super_admin') return true;
  if (typeof actor.hasPermission === 'function') {
    return actor.hasPermission(`${module}.approve`);
  }
  return false;
};

/**
 * Users whose role holds `${module}.approve` — the approval-PIN authority.
 */
const getSalesManagerUserIds = async (tenantId, module = 'leads') => {
  const roles = await db.Role.findAll({
    where: {
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
    include: [{ model: db.Permission, as: 'permissions', where: { name: `${module}.approve` }, required: true }],
    attributes: ['id'],
  });
  const roleIds = roles.map((r) => r.id);
  if (roleIds.length === 0) return [];

  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: { [Op.in]: roleIds }, status: 'active' },
    attributes: ['id'],
  });
  return users.map((u) => u.id);
};

const getLeadApprovalPinHash = async (tenantId) => {
  const tenant = await db.Tenant.findByPk(tenantId, { attributes: ['settings'] });
  const settings = parseTenantSettings(tenant?.settings);
  return settings[PIN_SETTINGS_KEY] || null;
};

const isLeadApprovalPinConfigured = async (tenantId) => {
  const hash = await getLeadApprovalPinHash(tenantId);
  return Boolean(hash);
};

const setLeadApprovalPin = async (tenantId, pin) => {
  if (!pin || String(pin).trim().length < 4) {
    const ApiError = require('./apiError');
    throw ApiError.badRequest('PIN must be at least 4 characters');
  }
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) {
    const ApiError = require('./apiError');
    throw ApiError.notFound('Tenant not found');
  }
  const settings = cleanTenantSettings(tenant.settings);
  settings[PIN_SETTINGS_KEY] = await hashPassword(String(pin).trim());
  await tenant.update({ settings });
  return true;
};

const verifyLeadApprovalPin = async (tenantId, pin) => {
  const hash = await getLeadApprovalPinHash(tenantId);
  if (!hash) return false;
  return comparePassword(String(pin || '').trim(), hash);
};

module.exports = {
  isManagerRole,
  getSalesManagerUserIds,
  getLeadApprovalPinHash,
  isLeadApprovalPinConfigured,
  setLeadApprovalPin,
  verifyLeadApprovalPin,
};
