#!/usr/bin/env node
/**
 * Remove transactional / test business data while keeping system seed data.
 *
 * KEPT: tenants, users, roles, permissions, role_permissions, lookup dropdowns,
 *       material_types, work_types, chart_of_accounts, terms_and_conditions, migrations meta.
 *
 * Usage:
 *   CONFIRM_CLEAR=YES node scripts/clear-transactional-data.js
 *   CONFIRM_CLEAR=YES DRY_RUN=1 node scripts/clear-transactional-data.js
 */
'use strict';

require('dotenv').config();
const db = require('../src/models');

const KEEP_TABLES = new Set([
  'tenants',
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'designations',
  'industry_types',
  'uae_cities',
  'countries',
  'lead_sources',
  'contact_roles',
  'service_interests',
  'product_categories',
  'units_of_measure',
  'deal_statuses',
  'payment_statuses',
  'statuses',
  'quotation_statuses',
  'purchase_order_statuses',
  'material_types',
  'work_types',
  'chart_of_accounts',
  'terms_and_conditions',
  'deal_stages',
  'deal_types',
  'service_types',
  'sequelizemeta',
  'sequelize_meta',
  'migration_history',
  'migrations',
]);

async function getTables() {
  const dbName = db.sequelize.config.database;
  const [rows] = await db.sequelize.query(
    `SELECT table_name AS name
     FROM information_schema.tables
     WHERE table_schema = ? AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    { replacements: [dbName] },
  );
  return rows.map((r) => r.name);
}

async function countRows(table) {
  const [[{ c }]] = await db.sequelize.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(c);
}

async function main() {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  if (!dryRun && process.env.CONFIRM_CLEAR !== 'YES') {
    console.error('Refusing to run without CONFIRM_CLEAR=YES (use DRY_RUN=1 to preview).');
    process.exit(1);
  }

  const allTables = await getTables();
  const toClear = allTables.filter((t) => !KEEP_TABLES.has(t));
  const kept = allTables.filter((t) => KEEP_TABLES.has(t));

  console.log(`Database: ${db.sequelize.config.database}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'CLEAR'}`);
  console.log(`Keeping ${kept.length} tables: ${kept.join(', ')}`);
  console.log(`Clearing ${toClear.length} tables...\n`);

  if (dryRun) {
    for (const table of toClear) {
      const c = await countRows(table);
      if (c > 0) console.log(`  would truncate ${table} (${c} rows)`);
    }
    console.log('\nDry run complete. Run with CONFIRM_CLEAR=YES to apply.');
    process.exit(0);
  }

  const t = await db.sequelize.transaction();
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

    let cleared = 0;
    for (const table of toClear) {
      const before = await countRows(table);
      if (before === 0) continue;
      await db.sequelize.query(`TRUNCATE TABLE \`${table}\``, { transaction: t });
      console.log(`  truncated ${table} (${before} rows)`);
      cleared += 1;
    }

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    await t.commit();

    console.log(`\nCleared ${cleared} tables.`);
    console.log('\nRow counts (kept tables):');
    for (const table of kept.sort()) {
      if (!(await getTables()).includes(table)) continue;
      console.log(`  ${table}: ${await countRows(table)}`);
    }
    console.log('\nDone. Roles, permissions, users, and lookup seed data are unchanged.');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Clear failed:', err.message);
    process.exit(1);
  }
}

main();
