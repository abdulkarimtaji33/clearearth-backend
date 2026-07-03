/**
 * One-time data backfill: grants the new dynamic-permission equivalents of the
 * old hardcoded role-name behavior, so existing tenants don't lose access when
 * this feature ships. Run manually once, after migrations + seed:
 *
 *   node src/database/migrate-role-permissions.js
 *
 * Safe to re-run (idempotent — uses addPermissions, does not remove any existing grant).
 */
const db = require('../models');
const { SCOPED_MODULES, FINANCIAL_MODULES } = require('../constants');

const SCOPED_ACTIONS_FOR_BACKFILL = ['read', 'update', 'delete'];

const permissionNamesFor = (roleKind) => {
  const names = [];

  if (roleKind === 'all') {
    for (const module of SCOPED_MODULES) {
      for (const action of SCOPED_ACTIONS_FOR_BACKFILL) {
        names.push(`${module}.${action}.all`);
      }
    }
    for (const module of FINANCIAL_MODULES) {
      names.push(`${module}.view_price`);
    }
    names.push('leads.approve', 'deals.approve', 'quotations.approve', 'purchase_orders.approve');
  }

  if (roleKind === 'own') {
    for (const module of SCOPED_MODULES) {
      for (const action of SCOPED_ACTIONS_FOR_BACKFILL) {
        names.push(`${module}.${action}.own`);
      }
    }
  }

  if (roleKind === 'operations') {
    // operations_manager / operations saw all deals/quotations (scopeHelper only
    // scoped the literal 'sales' role) but never had pricing visibility.
    names.push('deals.read.all', 'deals.update.all');
    names.push('quotations.read.all');
    names.push('operations.create', 'operations.read', 'operations.update', 'operations.delete');
  }

  if (roleKind === 'accounts') {
    names.push('accounting.create', 'accounting.read', 'accounting.update', 'accounting.delete');
    names.push('reports.read');
  }

  return names;
};

const ROLE_BACKFILL_MAP = {
  sales: 'own',
  sales_executive: 'own',
  sales_manager: 'all',
  admin: 'all',
  tenant_admin: 'all',
  super_admin: 'all',
  operations_manager: 'operations',
  operations: 'operations',
  accounts: 'accounts',
};

const run = async () => {
  console.log('🔧 Backfilling dynamic permissions for existing roles...\n');

  const roles = await db.Role.findAll({ include: [{ model: db.Permission, as: 'permissions' }] });
  console.log(`Found ${roles.length} roles`);

  for (const role of roles) {
    const kind = ROLE_BACKFILL_MAP[role.name];
    if (!kind) {
      console.log(`- Skipping role "${role.name}" (no backfill mapping)`);
      continue;
    }

    const names = permissionNamesFor(kind);
    if (names.length === 0) continue;

    const permissions = await db.Permission.findAll({ where: { name: names } });
    const found = permissions.map((p) => p.name);
    const missing = names.filter((n) => !found.includes(n));
    if (missing.length) {
      console.log(`  ⚠ Role "${role.name}": ${missing.length} expected permissions not found in DB (run seed.js first): ${missing.join(', ')}`);
    }

    if (permissions.length === 0) continue;

    await role.addPermissions(permissions);
    console.log(`✅ Role "${role.name}" (id=${role.id}, tenant_id=${role.tenant_id ?? 'system'}): granted ${permissions.length} permissions [${kind}]`);
  }

  console.log('\n✅ Backfill completed.');
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });
