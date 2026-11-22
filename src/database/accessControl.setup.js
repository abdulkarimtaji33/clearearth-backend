/**
 * Access control schema + catalog sync + legacy-preserving seed.
 * Idempotent: safe to run on every deploy and at every server start.
 */
const catalog = require('../config/accessCatalog');

const isDup = (e) => {
  const m = e?.message || '';
  return m.includes('Duplicate') || m.includes('already exists');
};

async function ensureSchema(sequelize, log) {
  const q = (sql, opts) => sequelize.query(sql, opts);
  const tryRun = async (sql) => {
    try { await q(sql); } catch (e) { if (!isDup(e)) log(`  schema warn: ${e.message}`); }
  };

  // permissions: free-form module/action so new permissions never need an enum migration
  await tryRun(`ALTER TABLE permissions MODIFY COLUMN module VARCHAR(50) NOT NULL`);
  await tryRun(`ALTER TABLE permissions MODIFY COLUMN action VARCHAR(50) NOT NULL`);
  await tryRun(`ALTER TABLE permissions ADD COLUMN category VARCHAR(50) NULL`);
  await tryRun(`ALTER TABLE permissions ADD COLUMN is_dangerous TINYINT(1) NOT NULL DEFAULT 0`);
  await tryRun(`ALTER TABLE permissions ADD COLUMN is_catalog TINYINT(1) NOT NULL DEFAULT 0`);
  await tryRun(`ALTER TABLE permissions ADD COLUMN sort_order INT NOT NULL DEFAULT 0`);

  await tryRun(`ALTER TABLE roles ADD COLUMN default_snapshot LONGTEXT NULL`);
  await tryRun(`ALTER TABLE roles ADD COLUMN color VARCHAR(20) NULL`);

  await q(`
    CREATE TABLE IF NOT EXISTS user_permission_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      user_id INT NOT NULL,
      permission_id INT NOT NULL,
      effect ENUM('grant','revoke') NOT NULL,
      reason VARCHAR(255) NULL,
      expires_at DATETIME NULL,
      created_by INT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY uniq_upo_user_perm (user_id, permission_id),
      INDEX idx_upo_tenant (tenant_id),
      INDEX idx_upo_user (user_id),
      CONSTRAINT fk_upo_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_upo_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS role_data_scopes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      module_key VARCHAR(50) NOT NULL,
      scope VARCHAR(20) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY uniq_rds_role_module (role_id, module_key),
      CONSTRAINT fk_rds_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS role_field_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      field_group VARCHAR(50) NOT NULL,
      visible TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      UNIQUE KEY uniq_rfr_role_group (role_id, field_group),
      CONSTRAINT fk_rfr_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS access_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NULL,
      actor_user_id INT NULL,
      actor_name VARCHAR(200) NULL,
      action VARCHAR(60) NOT NULL,
      target_type VARCHAR(30) NOT NULL,
      target_id INT NULL,
      target_label VARCHAR(200) NULL,
      details LONGTEXT NULL,
      created_at DATETIME NOT NULL,
      INDEX idx_aal_tenant (tenant_id),
      INDEX idx_aal_target (target_type, target_id),
      INDEX idx_aal_created (created_at)
    )
  `);
}

/** Names of roles matching a legacy rule, as role ids. */
async function rolesForLegacy(sequelize, legacy, permIdsByName) {
  const q = (sql, replacements) => sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
  const ids = new Set();
  if (!legacy) return ids;
  if (legacy.all) {
    (await q(`SELECT id FROM roles`)).forEach((r) => ids.add(r.id));
    return ids;
  }
  if (legacy.allExcept) {
    const rows = await q(`SELECT id FROM roles WHERE name NOT IN (?)`, [legacy.allExcept]);
    rows.forEach((r) => ids.add(r.id));
  }
  if (legacy.roles?.length) {
    (await q(`SELECT id FROM roles WHERE name IN (?)`, [legacy.roles])).forEach((r) => ids.add(r.id));
  }
  if (legacy.inherit?.length) {
    const pids = legacy.inherit.map((n) => permIdsByName[n]).filter(Boolean);
    if (pids.length) {
      (await q(`SELECT DISTINCT role_id AS id FROM role_permissions WHERE permission_id IN (?)`, [pids])).forEach((r) => ids.add(r.id));
    }
  }
  return ids;
}

async function syncCatalog(sequelize, log) {
  const q = (sql, replacements) => sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
  const exec = (sql, replacements) => sequelize.query(sql, { replacements });

  const existing = await q(`SELECT id, name FROM permissions`);
  const idByName = Object.fromEntries(existing.map((r) => [r.name, r.id]));
  const hadMarker = Boolean(idByName['workflow.manager']);
  const firstRun = !hadMarker;

  const created = [];
  let order = 0;
  for (const p of catalog.PERMISSIONS) {
    order += 1;
    if (idByName[p.name]) {
      await exec(
        `UPDATE permissions SET display_name = ?, module = ?, action = ?, category = ?, description = ?,
           is_dangerous = ?, is_catalog = 1, sort_order = ? WHERE id = ?`,
        [p.label, p.module, p.action, p.category, p.description, p.danger ? 1 : 0, order, idByName[p.name]]
      );
    } else {
      const [res] = await exec(
        `INSERT INTO permissions (name, display_name, module, action, category, description, is_dangerous, is_catalog, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [p.name, p.label, p.module, p.action, p.category, p.description, p.danger ? 1 : 0, order]
      );
      idByName[p.name] = res;
      created.push(p);
    }
  }
  // Re-read ids (INSERT result shape differs across drivers)
  const all = await q(`SELECT id, name FROM permissions`);
  Object.keys(idByName).forEach((k) => delete idByName[k]);
  all.forEach((r) => { idByName[r.name] = r.id; });

  // Anything not in the catalog is not enforced anywhere — hide it from the matrix
  const names = catalog.PERMISSIONS.map((p) => p.name);
  await exec(`UPDATE permissions SET is_catalog = 0 WHERE name NOT IN (?)`, [names]);

  // Grant permissions to existing roles per their legacy rule so behaviour is unchanged.
  // On the very first run this also covers permissions that already existed in the database but were
  // never enforced before (e.g. products.*); afterwards only newly created permissions are granted.
  const grantList = firstRun ? catalog.PERMISSIONS.filter((p) => p.legacy) : created;
  for (const p of grantList) {
    const roleIds = await rolesForLegacy(sequelize, p.legacy, idByName);
    for (const roleId of roleIds) {
      await exec(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, idByName[p.name]]);
    }
  }
  if (created.length) log(`  access: added ${created.length} new permission(s) to the catalog`);

  if (firstRun) {
    log('  access: first run — preserving legacy behaviour');
    for (const rule of catalog.LEGACY_TIGHTEN) {
      const roles = await q(`SELECT id FROM roles WHERE name IN (?)`, [rule.roles]);
      const pids = rule.remove.map((n) => idByName[n]).filter(Boolean);
      for (const r of roles) {
        if (pids.length) await exec(`DELETE FROM role_permissions WHERE role_id = ? AND permission_id IN (?)`, [r.id, pids]);
      }
    }
    for (const rule of catalog.LEGACY_PREFIX_GRANTS) {
      const roles = await q(`SELECT id FROM roles WHERE name IN (?)`, [rule.roles]);
      const perms = await q(`SELECT id FROM permissions WHERE name LIKE ? AND is_catalog = 1`, [`${rule.prefix}%`]);
      for (const r of roles) {
        for (const pm of perms) {
          await exec(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [r.id, pm.id]);
        }
      }
    }
    // Admin-type roles hold every catalog permission so the matrix shows full access —
    // except "identity" capabilities that select a persona (dashboard variant, inspector, own commissions),
    // which keep their own legacy rules.
    const adminRoles = await q(`SELECT id FROM roles WHERE name IN (?)`, [catalog.ADMIN_ROLES]);
    const catPerms = await q(
      `SELECT id FROM permissions WHERE is_catalog = 1
         AND name NOT LIKE 'dashboard.%' AND name NOT IN ('inspection_reports.perform', 'commissions.view_own')`
    );
    for (const r of adminRoles) {
      for (const pm of catPerms) {
        await exec(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [r.id, pm.id]);
      }
    }
    // Data scopes
    for (const ds of catalog.DATA_SCOPES) {
      for (const [scope, roleNames] of Object.entries(ds.legacy || {})) {
        const roles = await q(`SELECT id FROM roles WHERE name IN (?)`, [roleNames]);
        for (const r of roles) {
          await exec(
            `INSERT IGNORE INTO role_data_scopes (role_id, module_key, scope, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
            [r.id, ds.key, scope]
          );
        }
      }
    }
    // Field rules
    for (const fg of catalog.FIELD_GROUPS) {
      const roles = await q(`SELECT id FROM roles WHERE name IN (?)`, [fg.legacyHidden || []]);
      for (const r of roles) {
        await exec(
          `INSERT IGNORE INTO role_field_rules (role_id, field_group, visible, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())`,
          [r.id, fg.key]
        );
      }
    }
  }

  return { firstRun, created: created.length };
}

/** Snapshot system roles' factory defaults so "Reset to default" works. Only fills missing snapshots. */
async function snapshotSystemRoles(sequelize, log) {
  const q = (sql, replacements) => sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
  const roles = await q(`SELECT id FROM roles WHERE is_system_role = 1 AND default_snapshot IS NULL`);
  for (const r of roles) {
    const perms = await q(
      `SELECT p.name FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ? AND p.is_catalog = 1`,
      [r.id]
    );
    const scopes = await q(`SELECT module_key, scope FROM role_data_scopes WHERE role_id = ?`, [r.id]);
    const fields = await q(`SELECT field_group FROM role_field_rules WHERE role_id = ? AND visible = 0`, [r.id]);
    const snapshot = {
      permissions: perms.map((p) => p.name),
      scopes: Object.fromEntries(scopes.map((s) => [s.module_key, s.scope])),
      hiddenFieldGroups: fields.map((f) => f.field_group),
    };
    await sequelize.query(`UPDATE roles SET default_snapshot = ? WHERE id = ?`, { replacements: [JSON.stringify(snapshot), r.id] });
  }
  if (roles.length) log(`  access: snapshotted ${roles.length} system role default(s)`);
}

async function ensureAccessControl(sequelize, log = console.log) {
  await ensureSchema(sequelize, log);
  const result = await syncCatalog(sequelize, log);
  await snapshotSystemRoles(sequelize, log);
  return result;
}

module.exports = { ensureAccessControl };
