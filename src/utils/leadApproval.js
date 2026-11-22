/**
 * Lead approval PIN and manager helpers
 */
const db = require('../models');
const { Op } = db.Sequelize;
const { MANAGER_ROLES } = require('../constants');
const { hashPassword, comparePassword } = require('./helpers');
const { parseTenantSettings, cleanTenantSettings } = require('./tenantSettings');

const PIN_SETTINGS_KEY = 'leadApprovalPinHash';

/**
 * Manager authority is the `workflow.manager` permission (editable per role in the Roles UI).
 * Accepts an actor ({ access, roleName }), an Access object, or (legacy) a bare role name.
 */
const isManagerRole = (subject) => {
  if (subject && typeof subject === 'object') {
    if (typeof subject.has === 'function') return subject.has('workflow.manager');
    if (subject.access) return subject.access.has('workflow.manager');
    return MANAGER_ROLES.includes(subject.roleName);
  }
  return MANAGER_ROLES.includes(subject);
};

/**
 * May the actor approve a quotation / purchase order directly (without manager sign-off)?
 * Managers always can; otherwise the actor needs the given approval permission.
 */
const canApproveDirectly = (actor, permission) => {
  if (isManagerRole(actor)) return true;
  if (actor && actor.access) return actor.access.has(permission);
  return actor?.roleName === 'sales';
};

const getSalesManagerUserIds = async (tenantId) => {
  const roles = await db.Role.findAll({
    where: {
      name: 'sales_manager',
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
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
  canApproveDirectly,
  getSalesManagerUserIds,
  getLeadApprovalPinHash,
  isLeadApprovalPinConfigured,
  setLeadApprovalPin,
  verifyLeadApprovalPin,
};
