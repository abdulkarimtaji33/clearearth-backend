/**
 * Role Service — roles, their permission matrix, data scopes and field visibility.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const catalog = require('../config/accessCatalog');
const accessService = require('./access.service');
const accessAudit = require('./accessAudit.service');
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');
const { isNonEscalating } = require('../utils/accessRules');
const { Op } = db.Sequelize;

const IMMUTABLE_ROLES = ['super_admin'];
const ROLE_NAME_RE = /^[a-z][a-z0-9_]{1,60}$/;

const tenantRoleWhere = (tenantId) => ({ [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }] });

const normalizeName = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const notifyRoleUsers = async (roleId) => {
  accessService.invalidateRole(roleId);
  try {
    const users = await db.User.findAll({ where: { role_id: roleId }, attributes: ['id'] });
    require('../socket').emitToUsers(users.map((u) => u.id), 'access:changed', { roleId });
  } catch { /* socket optional */ }
};

/** Resolve a mixed list of permission ids / names to catalog permission rows. */
const resolvePermissions = async (list = []) => {
  const names = [];
  const ids = [];
  for (const v of list) {
    if (typeof v === 'number' || /^\d+$/.test(String(v))) ids.push(Number(v));
    else if (v) names.push(String(v));
  }
  const where = { is_catalog: true, [Op.or]: [] };
  if (ids.length) where[Op.or].push({ id: { [Op.in]: ids } });
  if (names.length) where[Op.or].push({ name: { [Op.in]: names } });
  if (!where[Op.or].length) return [];
  return db.Permission.findAll({ where });
};

const sanitizeScopes = (scopes = {}) => {
  const out = {};
  for (const def of catalog.DATA_SCOPES) {
    const v = scopes[def.key];
    if (v == null) continue;
    if (!def.scopes.includes(v)) throw ApiError.badRequest(`Invalid data scope "${v}" for ${def.label}`);
    out[def.key] = v;
  }
  return out;
};

const sanitizeFieldGroups = (groups = []) => {
  const valid = new Set(catalog.FIELD_GROUPS.map((g) => g.key));
  return [...new Set(groups.filter((g) => valid.has(g)))];
};

const loadRoleAccess = async (role) => {
  const [perms, scopes, fields, userCount] = await Promise.all([
    db.sequelize.query(
      `SELECT p.id, p.name FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = ? AND p.is_catalog = 1`,
      { replacements: [role.id], type: db.sequelize.QueryTypes.SELECT }
    ),
    db.RoleDataScope.findAll({ where: { role_id: role.id } }),
    db.RoleFieldRule.findAll({ where: { role_id: role.id } }),
    db.User.count({ where: { role_id: role.id } }),
  ]);
  const scopeMap = {};
  scopes.forEach((s) => { scopeMap[s.module_key] = s.scope; });
  const fullScopes = Object.fromEntries(catalog.DATA_SCOPES.map((d) => [d.key, scopeMap[d.key] || d.default]));
  return {
    permissionIds: perms.map((p) => p.id),
    permissionNames: perms.map((p) => p.name),
    scopes: fullScopes,
    hiddenFieldGroups: fields.filter((f) => !f.visible).map((f) => f.field_group),
    userCount,
  };
};

const sameAsSnapshot = (role, access) => {
  if (!role.default_snapshot) return null;
  try {
    const snap = JSON.parse(role.default_snapshot);
    const a = [...access.permissionNames].sort().join(',');
    const b = [...(snap.permissions || [])].sort().join(',');
    if (a !== b) return false;
    for (const d of catalog.DATA_SCOPES) {
      if ((snap.scopes?.[d.key] || d.default) !== access.scopes[d.key]) return false;
    }
    const f1 = [...access.hiddenFieldGroups].sort().join(',');
    const f2 = [...(snap.hiddenFieldGroups || [])].sort().join(',');
    return f1 === f2;
  } catch { return null; }
};

const serializeRole = (role, access, extra = {}) => ({
  id: role.id,
  tenant_id: role.tenant_id,
  name: role.name,
  display_name: role.display_name,
  description: role.description,
  color: role.color,
  is_system_role: role.is_system_role,
  status: role.status,
  created_at: role.created_at,
  updated_at: role.updated_at,
  permissionCount: access.permissionNames.length,
  userCount: access.userCount,
  isLocked: IMMUTABLE_ROLES.includes(role.name),
  canReset: Boolean(role.is_system_role && role.default_snapshot),
  isCustomized: role.is_system_role ? sameAsSnapshot(role, access) === false : false,
  ...extra,
});

const getAll = async (tenantId, filters = {}) => {
  const { offset, limit, search, dateFrom, dateTo } = filters;
  const where = {
    [Op.and]: [
      tenantRoleWhere(tenantId),
      ...(search ? [{ [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { display_name: { [Op.like]: `%${search}%` } }] }] : []),
    ],
  };
  applyCreatedAtFilter(where, dateFrom, dateTo);

  const { count, rows } = await db.Role.findAndCountAll({
    where,
    offset,
    limit,
    order: [['is_system_role', 'DESC'], ['display_name', 'ASC']],
    distinct: true,
  });

  const roles = [];
  for (const r of rows) roles.push(serializeRole(r, await loadRoleAccess(r)));
  return { roles, total: count };
};

const findRole = async (tenantId, roleId, options = {}) => {
  const role = await db.Role.findOne({ where: { id: roleId, ...tenantRoleWhere(tenantId) }, ...options });
  if (!role) throw ApiError.notFound('Role not found');
  return role;
};

const getById = async (tenantId, roleId) => {
  const role = await findRole(tenantId, roleId);
  const access = await loadRoleAccess(role);
  return serializeRole(role, access, {
    permissions: access.permissionNames,
    permissionIds: access.permissionIds,
    scopes: access.scopes,
    hiddenFieldGroups: access.hiddenFieldGroups,
  });
};

/** Which permissions the actor may hand out (everything they hold themselves; super_admin: all). */
const assertCanGrant = (actorAccess, permissionNames, roleLabel = 'this role') => {
  if (!actorAccess || actorAccess.isSuperAdmin) return;
  const missing = permissionNames.filter((n) => !isNonEscalating(n) && !actorAccess.has(n));
  if (missing.length) {
    throw ApiError.forbidden(
      `You can only grant permissions you hold yourself. Not allowed for ${roleLabel}: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`
    );
  }
};

const applyAccess = async (role, { permissions, scopes, hiddenFieldGroups }, transaction) => {
  if (permissions) await role.setPermissions(permissions.map((p) => p.id), { transaction });
  if (scopes) {
    await db.RoleDataScope.destroy({ where: { role_id: role.id }, transaction });
    const rows = Object.entries(scopes).map(([module_key, scope]) => ({ role_id: role.id, module_key, scope }));
    if (rows.length) await db.RoleDataScope.bulkCreate(rows, { transaction });
  }
  if (hiddenFieldGroups) {
    await db.RoleFieldRule.destroy({ where: { role_id: role.id }, transaction });
    const rows = hiddenFieldGroups.map((field_group) => ({ role_id: role.id, field_group, visible: false }));
    if (rows.length) await db.RoleFieldRule.bulkCreate(rows, { transaction });
  }
};

const diffAccess = (before, after) => ({
  permissionsAdded: after.permissionNames.filter((n) => !before.permissionNames.includes(n)),
  permissionsRemoved: before.permissionNames.filter((n) => !after.permissionNames.includes(n)),
  scopes: Object.fromEntries(
    Object.keys(after.scopes).filter((k) => before.scopes[k] !== after.scopes[k]).map((k) => [k, { from: before.scopes[k], to: after.scopes[k] }])
  ),
  fieldsHidden: after.hiddenFieldGroups.filter((g) => !before.hiddenFieldGroups.includes(g)),
  fieldsShown: before.hiddenFieldGroups.filter((g) => !after.hiddenFieldGroups.includes(g)),
});

const create = async (tenantId, data, actor = {}) => {
  const name = normalizeName(data.name || data.displayName || data.display_name);
  if (!ROLE_NAME_RE.test(name)) throw ApiError.badRequest('Role name must be 2–60 letters, numbers or underscores');

  const existing = await db.Role.findOne({ where: { name, ...tenantRoleWhere(tenantId) } });
  if (existing) throw ApiError.conflict('A role with this name already exists');

  let permissionList = data.permissions;
  let scopes = data.scopes;
  let hidden = data.hiddenFieldGroups;

  // Clone: start from another role's access
  if (data.cloneFromId) {
    const source = await findRole(tenantId, data.cloneFromId);
    const src = await loadRoleAccess(source);
    permissionList = permissionList || src.permissionIds;
    scopes = scopes || src.scopes;
    hidden = hidden || src.hiddenFieldGroups;
  }

  const permissions = await resolvePermissions(permissionList || []);
  assertCanGrant(actor.access, permissions.map((p) => p.name));

  const transaction = await db.sequelize.transaction();
  try {
    const displayName = (data.displayName || data.display_name || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).trim();
    const role = await db.Role.create(
      {
        tenant_id: tenantId,
        name,
        display_name: displayName,
        description: data.description || null,
        color: data.color || null,
        is_system_role: false,
        status: 'active',
      },
      { transaction }
    );
    await applyAccess(role, { permissions, scopes: sanitizeScopes(scopes || {}), hiddenFieldGroups: sanitizeFieldGroups(hidden || []) }, transaction);
    await transaction.commit();

    await accessAudit.log(actor, {
      action: data.cloneFromId ? 'role.clone' : 'role.create',
      targetType: 'role',
      targetId: role.id,
      targetLabel: role.display_name,
      details: { permissions: permissions.map((p) => p.name), clonedFrom: data.cloneFromId || null },
    });
    return getById(tenantId, role.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/** Edit name / description / colour (identity name is fixed once created). */
const update = async (tenantId, roleId, data, actor = {}) => {
  const role = await findRole(tenantId, roleId);
  if (IMMUTABLE_ROLES.includes(role.name)) throw ApiError.badRequest('The Super Admin role cannot be modified');

  const patch = {};
  const displayName = data.displayName || data.display_name;
  if (displayName) patch.display_name = String(displayName).trim();
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.color !== undefined) patch.color = data.color || null;
  await role.update(patch);

  // Backwards compatible: allow permissions in the same call
  if (data.permissions || data.scopes || data.hiddenFieldGroups) {
    return saveAccess(tenantId, roleId, data, actor);
  }

  await accessAudit.log(actor, { action: 'role.update', targetType: 'role', targetId: role.id, targetLabel: role.display_name, details: patch });
  return getById(tenantId, roleId);
};

/** Replace a role's permissions / data scopes / field rules. */
const saveAccess = async (tenantId, roleId, data, actor = {}) => {
  const role = await findRole(tenantId, roleId);
  if (IMMUTABLE_ROLES.includes(role.name)) throw ApiError.badRequest('The Super Admin role always has full access and cannot be changed');

  const before = await loadRoleAccess(role);
  const permissions = data.permissions ? await resolvePermissions(data.permissions) : null;
  const scopes = data.scopes ? sanitizeScopes(data.scopes) : null;
  const hidden = data.hiddenFieldGroups ? sanitizeFieldGroups(data.hiddenFieldGroups) : null;

  if (permissions) {
    const newNames = permissions.map((p) => p.name);
    const added = newNames.filter((n) => !before.permissionNames.includes(n));
    assertCanGrant(actor.access, added, `"${role.display_name}"`);

    // Lock-out protection: you can't remove your own ability to manage roles
    if (actor.roleId && actor.roleId === role.id && !(actor.access?.isSuperAdmin)) {
      if (!newNames.includes('roles.update') || !newNames.includes('roles.read')) {
        throw ApiError.badRequest('You cannot remove "View roles" / "Edit roles & access" from your own role — you would lock yourself out.');
      }
    }
  }

  const transaction = await db.sequelize.transaction();
  try {
    await applyAccess(role, { permissions, scopes, hiddenFieldGroups: hidden }, transaction);
    await role.update({ updated_at: new Date() }, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const after = await loadRoleAccess(role);
  const diff = diffAccess(before, after);
  await accessAudit.log(actor, {
    action: 'role.access.update',
    targetType: 'role',
    targetId: role.id,
    targetLabel: role.display_name,
    details: diff,
  });
  await notifyRoleUsers(role.id);
  return getById(tenantId, roleId);
};

/** Restore a system role to its factory permissions / scopes / field rules. */
const reset = async (tenantId, roleId, actor = {}) => {
  const role = await findRole(tenantId, roleId);
  if (!role.is_system_role || !role.default_snapshot) throw ApiError.badRequest('This role has no factory defaults to restore');
  if (IMMUTABLE_ROLES.includes(role.name)) throw ApiError.badRequest('The Super Admin role cannot be changed');

  const snap = JSON.parse(role.default_snapshot);
  if (actor.roleId && actor.roleId === role.id && !(actor.access?.isSuperAdmin)) {
    if (!(snap.permissions || []).includes('roles.update')) {
      throw ApiError.badRequest('Resetting your own role would remove your ability to manage roles.');
    }
  }
  const before = await loadRoleAccess(role);
  const permissions = await resolvePermissions(snap.permissions || []);
  const transaction = await db.sequelize.transaction();
  try {
    await applyAccess(
      role,
      {
        permissions,
        scopes: sanitizeScopes(snap.scopes || {}),
        hiddenFieldGroups: sanitizeFieldGroups(snap.hiddenFieldGroups || []),
      },
      transaction
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  const after = await loadRoleAccess(role);
  await accessAudit.log(actor, {
    action: 'role.reset',
    targetType: 'role',
    targetId: role.id,
    targetLabel: role.display_name,
    details: diffAccess(before, after),
  });
  await notifyRoleUsers(role.id);
  return getById(tenantId, roleId);
};

const remove = async (tenantId, roleId, actor = {}) => {
  const role = await findRole(tenantId, roleId);
  if (role.is_system_role) throw ApiError.badRequest('System roles cannot be deleted. You can edit or reset them instead.');

  const usersCount = await db.User.count({ where: { role_id: roleId } });
  if (usersCount > 0) throw ApiError.badRequest(`Cannot delete a role that still has ${usersCount} user(s). Move them to another role first.`);

  const label = role.display_name;
  // Hard delete (not soft): frees the role name for re-use; scopes/field rules cascade, history stays in the audit log
  await role.setPermissions([]);
  await role.destroy({ force: true });
  await accessAudit.log(actor, { action: 'role.delete', targetType: 'role', targetId: roleId, targetLabel: label });
};

/** Users currently on the role. */
const getUsers = async (tenantId, roleId) => {
  await findRole(tenantId, roleId);
  const users = await db.User.findAll({
    where: { role_id: roleId, tenant_id: tenantId },
    attributes: ['id', 'first_name', 'last_name', 'email', 'status', 'avatar'],
    order: [['first_name', 'ASC']],
  });
  const overrides = await db.UserPermissionOverride.findAll({
    where: { user_id: { [Op.in]: users.map((u) => u.id) } },
    attributes: ['user_id'],
  });
  const counts = {};
  overrides.forEach((o) => { counts[o.user_id] = (counts[o.user_id] || 0) + 1; });
  return users.map((u) => ({ ...u.get({ plain: true }), overrideCount: counts[u.id] || 0 }));
};

/** Catalog for the matrix UI: modules → permissions, data-scope modules, field groups. */
const getCatalog = async () => {
  const perms = await db.Permission.findAll({
    where: { is_catalog: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  const byModule = {};
  for (const p of perms) {
    (byModule[p.module] = byModule[p.module] || []).push({
      id: p.id,
      name: p.name,
      label: p.display_name,
      description: p.description,
      module: p.module,
      category: p.category,
      action: p.action,
      danger: Boolean(p.is_dangerous),
    });
  }
  const modules = catalog.MODULES
    .filter((m) => byModule[m.key]?.length)
    .map((m) => ({ ...m, permissions: byModule[m.key] }));
  return {
    modules,
    actionLabels: catalog.ACTION_LABELS,
    standardActions: catalog.STANDARD_ACTIONS,
    dataScopes: catalog.DATA_SCOPES.map(({ legacy, ...d }) => d),
    fieldGroups: catalog.FIELD_GROUPS.map(({ legacyHidden, ...g }) => g),
    totalPermissions: perms.length,
  };
};

/** Backwards-compatible grouped list (module → permissions). */
const getAllPermissions = async () => {
  const perms = await db.Permission.findAll({ where: { is_catalog: true }, order: [['sort_order', 'ASC']] });
  return perms.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});
};

/** Which roles and users hold a permission. */
const getPermissionHolders = async (tenantId, permissionName) => {
  const perm = await db.Permission.findOne({ where: { name: permissionName } });
  if (!perm) throw ApiError.notFound('Permission not found');

  const roles = await db.Role.findAll({
    where: tenantRoleWhere(tenantId),
    include: [{ model: db.Permission, as: 'permissions', where: { id: perm.id }, attributes: [] }],
    attributes: ['id', 'name', 'display_name'],
  });
  const overrides = await db.UserPermissionOverride.findAll({
    where: { tenant_id: tenantId, permission_id: perm.id },
    include: [{ model: db.User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
  });
  const rolesOut = [];
  for (const r of roles) rolesOut.push({ id: r.id, name: r.name, display_name: r.display_name, userCount: await db.User.count({ where: { role_id: r.id } }) });
  return {
    permission: { name: perm.name, label: perm.display_name },
    roles: rolesOut,
    userOverrides: overrides.map((o) => ({
      effect: o.effect,
      reason: o.reason,
      expires_at: o.expires_at,
      user: o.user ? { id: o.user.id, name: `${o.user.first_name} ${o.user.last_name}`.trim(), email: o.user.email } : null,
    })),
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  saveAccess,
  reset,
  remove,
  getUsers,
  getCatalog,
  getAllPermissions,
  getPermissionHolders,
  assignPermissionsToRole: (tenantId, roleId, permissions, actor) => saveAccess(tenantId, roleId, { permissions }, actor),
  notifyRoleUsers,
};
