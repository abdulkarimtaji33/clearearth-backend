/**
 * Access Service — computes a user's *effective* access:
 *   role permissions  +  per-user grants  −  per-user revokes
 *   + data scopes (own / team / all) per module
 *   + hidden field groups
 *
 * Everything in the app that used to look at role names should ask this instead:
 *   req.access.has('deals.update')
 *   req.access.scope('crm_records')       -> 'own' | 'team' | 'all'
 *   req.access.hidesField('financials')   -> boolean
 */
const db = require('../models');
const catalog = require('../config/accessCatalog');
const FULL_ACCESS_ROLES = ['admin', 'tenant_admin'];

const CACHE_TTL_MS = 10 * 1000;
const cache = new Map(); // key: userId -> { at, access }

class Access {
  constructor({ userId, roleId, roleName, permissions, scopes, hiddenGroups, grants, revokes }) {
    this.userId = userId;
    this.roleId = roleId;
    this.roleName = roleName;
    this.isSuperAdmin = roleName === 'super_admin';
    // Administrators can do everything inside their company, whatever permissions a role (old, new or custom) carries.
    this.isCompanyAdmin = FULL_ACCESS_ROLES.includes(roleName);
    this.permissions = permissions; // Set<string> — effective
    this.scopes = scopes || {};
    this.hiddenGroups = hiddenGroups || new Set();
    this.grants = grants || new Set();
    this.revokes = revokes || new Set();
  }

  has(permission) {
    if (this.isSuperAdmin) return true;
    // The cross-company platform dashboard is the only thing an administrator does not hold.
    if (this.isCompanyAdmin && permission !== 'dashboard.view_super_admin') return true;
    return this.permissions.has(permission);
  }

  hasAny(...permissions) {
    const list = permissions.flat();
    return list.some((p) => this.has(p));
  }

  hasAll(...permissions) {
    return permissions.flat().every((p) => this.has(p));
  }

  scope(moduleKey) {
    if (this.isSuperAdmin) return 'all';
    const def = catalog.DATA_SCOPES.find((d) => d.key === moduleKey);
    return this.scopes[moduleKey] || (def ? def.default : 'all');
  }

  hidesField(group) {
    if (this.isSuperAdmin) return false;
    return this.hiddenGroups.has(group);
  }

  toJSON() {
    return {
      permissions: this.isSuperAdmin
        ? catalog.PERMISSIONS.map((p) => p.name)
        : Array.from(this.permissions),
      scopes: Object.fromEntries(
        catalog.DATA_SCOPES.map((d) => [d.key, this.scope(d.key)])
      ),
      hiddenFieldGroups: Array.from(this.hiddenGroups),
      isSuperAdmin: this.isSuperAdmin,
    };
  }
}

/** Build effective access given a user instance with `role.permissions` already loaded. */
async function buildAccess(user) {
  const role = user.role;
  const rolePerms = new Set((role?.permissions || []).map((p) => p.name));

  const [overrides, scopeRows, fieldRows] = await Promise.all([
    db.UserPermissionOverride.findAll({
      where: { user_id: user.id },
      include: [{ model: db.Permission, as: 'permission', attributes: ['name'] }],
    }),
    db.RoleDataScope.findAll({ where: { role_id: user.role_id } }),
    db.RoleFieldRule.findAll({ where: { role_id: user.role_id } }),
  ]);

  const now = Date.now();
  const grants = new Set();
  const revokes = new Set();
  for (const o of overrides) {
    if (o.expires_at && new Date(o.expires_at).getTime() < now) continue;
    const name = o.permission?.name;
    if (!name) continue;
    if (o.effect === 'grant') grants.add(name);
    else revokes.add(name);
  }

  const effective = new Set(rolePerms);
  // Administrators can do everything inside their company: every catalog permission, including ones added later.
  // (dashboard.view_super_admin is the cross-company platform dashboard and stays with Super Admin.)
  if (FULL_ACCESS_ROLES.includes(role?.name)) {
    catalog.PERMISSIONS.forEach((p) => { if (p.name !== 'dashboard.view_super_admin') effective.add(p.name); });
  }
  grants.forEach((n) => effective.add(n));
  revokes.forEach((n) => effective.delete(n));

  const scopes = {};
  scopeRows.forEach((s) => { scopes[s.module_key] = s.scope; });
  const hiddenGroups = new Set(fieldRows.filter((f) => !f.visible).map((f) => f.field_group));

  return new Access({
    userId: user.id,
    roleId: user.role_id,
    roleName: role?.name,
    permissions: effective,
    scopes,
    hiddenGroups,
    grants,
    revokes,
  });
}

async function getAccess(user) {
  const hit = cache.get(user.id);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS && hit.roleId === user.role_id) return hit.access;
  const access = await buildAccess(user);
  cache.set(user.id, { at: Date.now(), access, roleId: user.role_id });
  return access;
}

const invalidateUser = (userId) => cache.delete(userId);
const invalidateRole = (roleId) => {
  for (const [uid, v] of cache.entries()) if (v.roleId === roleId) cache.delete(uid);
};
const invalidateAll = () => cache.clear();

/** Load access for any user id (used by admin "effective access" views). */
async function getAccessForUserId(tenantId, userId) {
  const user = await db.User.findOne({
    where: { id: userId, tenant_id: tenantId },
    include: [{ model: db.Role, as: 'role', include: [{ model: db.Permission, as: 'permissions', through: { attributes: [] } }] }],
  });
  if (!user) return null;
  const access = await buildAccess(user);
  return { user, access };
}

/** Fallback for code paths holding only a role name (e.g. legacy actor objects). */
const accessFromUser = (user) => user?.access || null;

module.exports = {
  Access,
  buildAccess,
  getAccess,
  getAccessForUserId,
  invalidateUser,
  invalidateRole,
  invalidateAll,
  accessFromUser,
};
