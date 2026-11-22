/**
 * Per-user access: effective permissions with explanations, and grant / revoke overrides.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const catalog = require('../config/accessCatalog');
const accessService = require('./access.service');
const accessAudit = require('./accessAudit.service');

const loadTarget = async (tenantId, userId) => {
  const loaded = await accessService.getAccessForUserId(tenantId, userId);
  if (!loaded) throw ApiError.notFound('User not found');
  return loaded;
};

const getUserAccess = async (tenantId, userId) => {
  const { user, access } = await loadTarget(tenantId, userId);
  const roleNames = new Set((user.role?.permissions || []).map((p) => p.name));

  const perms = await db.Permission.findAll({ where: { is_catalog: true }, order: [['sort_order', 'ASC']] });
  const overrides = await db.UserPermissionOverride.findAll({
    where: { user_id: user.id },
    include: [{ model: db.Permission, as: 'permission', attributes: ['id', 'name', 'display_name', 'module'] }],
    order: [['id', 'ASC']],
  });
  const now = Date.now();
  const overrideByName = {};
  overrides.forEach((o) => { if (o.permission) overrideByName[o.permission.name] = o; });

  const permissions = perms.map((p) => {
    const o = overrideByName[p.name];
    const expired = o && o.expires_at && new Date(o.expires_at).getTime() < now;
    const live = o && !expired ? o : null;
    let source = 'none';
    if (access.isSuperAdmin) source = 'super_admin';
    else if (live && live.effect === 'revoke') source = 'revoked';
    else if (live && live.effect === 'grant') source = 'granted';
    else if (roleNames.has(p.name)) source = 'role';
    return {
      name: p.name,
      label: p.display_name,
      module: p.module,
      category: p.category,
      action: p.action,
      danger: Boolean(p.is_dangerous),
      granted: access.has(p.name),
      roleHas: roleNames.has(p.name),
      source,
    };
  });

  return {
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      status: user.status,
      role: { id: user.role?.id, name: user.role?.name, display_name: user.role?.display_name },
    },
    isSuperAdmin: access.isSuperAdmin,
    permissions,
    overrides: overrides
      .filter((o) => o.permission)
      .map((o) => ({
        permission: o.permission.name,
        label: o.permission.display_name,
        module: o.permission.module,
        effect: o.effect,
        reason: o.reason,
        expiresAt: o.expires_at,
        expired: Boolean(o.expires_at && new Date(o.expires_at).getTime() < now),
        createdAt: o.created_at,
      })),
    scopes: access.toJSON().scopes,
    hiddenFieldGroups: Array.from(access.hiddenGroups),
    catalog: {
      dataScopes: catalog.DATA_SCOPES.map(({ legacy, ...d }) => d),
      fieldGroups: catalog.FIELD_GROUPS.map(({ legacyHidden, ...g }) => g),
    },
  };
};

/**
 * Replace the user's overrides.
 * body: [{ permission: 'deals.update', effect: 'grant'|'revoke', reason?, expiresAt? }]
 */
const saveOverrides = async (tenantId, userId, items = [], actor = {}) => {
  const { user, access: targetAccess } = await loadTarget(tenantId, userId);

  if (targetAccess.isSuperAdmin) throw ApiError.badRequest('Super Admin always has full access; overrides do not apply.');
  if (!actor.access?.isSuperAdmin && user.role?.name === 'super_admin') throw ApiError.forbidden('Only a Super Admin can change this user.');
  if (!Array.isArray(items)) throw ApiError.badRequest('overrides must be a list');

  const roleNames = new Set((user.role?.permissions || []).map((p) => p.name));
  const names = [...new Set(items.map((i) => i.permission))];
  const perms = names.length
    ? await db.Permission.findAll({ where: { name: names, is_catalog: true } })
    : [];
  const byName = Object.fromEntries(perms.map((p) => [p.name, p]));

  const rows = [];
  let dropped = 0;
  for (const it of items) {
    const perm = byName[it.permission];
    if (!perm) throw ApiError.badRequest(`Unknown permission: ${it.permission}`);
    if (!['grant', 'revoke'].includes(it.effect)) throw ApiError.badRequest(`Invalid effect for ${it.permission}`);
    const expiresAt = it.expiresAt ? new Date(it.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw ApiError.badRequest(`Invalid expiry date for ${it.permission}`);

    // Redundant overrides add noise — drop them
    if (it.effect === 'grant' && roleNames.has(perm.name)) { dropped += 1; continue; }
    if (it.effect === 'revoke' && !roleNames.has(perm.name)) { dropped += 1; continue; }

    if (it.effect === 'grant' && actor.access && !actor.access.isSuperAdmin && !actor.access.has(perm.name)) {
      throw ApiError.forbidden(`You can only grant permissions you hold yourself (${perm.name}).`);
    }
    if (it.effect === 'revoke' && actor.userId === user.id && ['roles.update', 'roles.read', 'users.update'].includes(perm.name)) {
      throw ApiError.badRequest('You cannot revoke your own ability to manage access — you would lock yourself out.');
    }
    rows.push({
      tenant_id: tenantId,
      user_id: user.id,
      permission_id: perm.id,
      effect: it.effect,
      reason: it.reason ? String(it.reason).slice(0, 255) : null,
      expires_at: expiresAt,
      created_by: actor.userId || null,
    });
  }

  const before = await db.UserPermissionOverride.findAll({
    where: { user_id: user.id },
    include: [{ model: db.Permission, as: 'permission', attributes: ['name'] }],
  });
  const beforeKeys = before.map((o) => `${o.effect}:${o.permission?.name}`);

  const transaction = await db.sequelize.transaction();
  try {
    await db.UserPermissionOverride.destroy({ where: { user_id: user.id }, transaction });
    if (rows.length) await db.UserPermissionOverride.bulkCreate(rows, { transaction });
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  const afterKeys = rows.map((r) => `${r.effect}:${perms.find((p) => p.id === r.permission_id).name}`);
  await accessAudit.log(actor, {
    action: 'user.overrides.update',
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.first_name} ${user.last_name}`.trim(),
    details: {
      added: afterKeys.filter((k) => !beforeKeys.includes(k)),
      removed: beforeKeys.filter((k) => !afterKeys.includes(k)),
      droppedRedundant: dropped,
    },
  });

  accessService.invalidateUser(user.id);
  try { require('../socket').emitToUsers([user.id], 'access:changed', { userId: user.id }); } catch { /* optional */ }

  return getUserAccess(tenantId, user.id);
};

module.exports = { getUserAccess, saveOverrides };
