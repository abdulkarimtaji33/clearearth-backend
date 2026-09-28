/**
 * One-off backfill: auto-provision an `employees` row (and current-year leave
 * balances) for every existing `users` row that doesn't have one yet.
 *
 * This is the historical counterpart to the auto-provisioning now done inline
 * in `src/services/user.service.js#create` for NEW users (see Fix 1 of the
 * HRM audit). Without this, existing users can't use self-service HR features
 * (check-in/out, leave requests, payslips) because they have no linked
 * employee record.
 *
 * Idempotent: only touches users where `employee_id IS NULL`, so re-running
 * this script is always safe — already-linked users are skipped.
 *
 * Usage:
 *   node scripts/backfill-employee-records.js
 */
const db = require('../src/models');
const { nextEmployeeCode } = require('../src/services/employee.service');
const leaveService = require('../src/services/leave.service');

async function run() {
  await db.sequelize.authenticate();
  console.log('Connected to database:', db.sequelize.config.database);

  const [tenants] = await db.sequelize.query('SELECT id, name FROM tenants');

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const perTenant = [];

  for (const tenant of tenants || []) {
    const [users] = await db.sequelize.query(
      `SELECT id, tenant_id, first_name, last_name, email, phone
       FROM users
       WHERE tenant_id = ? AND employee_id IS NULL AND deleted_at IS NULL`,
      { replacements: [tenant.id] }
    );

    let created = 0;
    let failed = 0;

    for (const user of users || []) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await db.sequelize.transaction(async (t) => {
          // Re-check inside the transaction/lock in case of concurrent runs.
          const [[freshUser]] = await db.sequelize.query(
            'SELECT employee_id FROM users WHERE id = ? FOR UPDATE',
            { replacements: [user.id], transaction: t }
          );
          if (!freshUser || freshUser.employee_id) {
            return; // already linked — skip (idempotent)
          }

          const employeeCode = await nextEmployeeCode(tenant.id, t);
          const employee = await db.Employee.create({
            tenant_id: tenant.id,
            user_id: user.id,
            employee_code: employeeCode,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email || null,
            phone: user.phone || null,
            date_of_joining: new Date().toISOString().slice(0, 10),
            employment_status: 'active',
          }, { transaction: t });

          await db.User.update({ employee_id: employee.id }, { where: { id: user.id }, transaction: t });

          created += 1;
          totalCreated += 1;

          // Stash the new employee id so we can init leave balances after commit.
          user.__newEmployeeId = employee.id;
        });

        if (user.__newEmployeeId) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await leaveService.initializeBalancesForEmployee(tenant.id, user.__newEmployeeId, new Date().getFullYear());
          } catch (e) {
            console.warn(`  [tenant ${tenant.id}] leave balance init skipped for user ${user.id}:`, e.message);
          }
        }
      } catch (e) {
        failed += 1;
        totalFailed += 1;
        console.error(`  [tenant ${tenant.id}] FAILED to backfill user ${user.id} (${user.email}):`, e.message);
      }
    }

    const skipped = 0; // users already linked were excluded by the WHERE clause, not counted here
    totalSkipped += skipped;
    perTenant.push({ tenantId: tenant.id, tenantName: tenant.name, usersConsidered: (users || []).length, created, failed });
  }

  // Overall skip count = users tenant-wide that already had employee_id set (for visibility)
  const [[{ alreadyLinked }]] = await db.sequelize.query(
    'SELECT COUNT(*) AS alreadyLinked FROM users WHERE employee_id IS NOT NULL AND deleted_at IS NULL'
  );

  console.log('\n=== Backfill summary ===');
  for (const row of perTenant) {
    console.log(`Tenant ${row.tenantId} (${row.tenantName}): considered=${row.usersConsidered}, created=${row.created}, failed=${row.failed}`);
  }
  console.log(`\nTotal employee records created: ${totalCreated}`);
  console.log(`Total failures: ${totalFailed}`);
  console.log(`Users already linked (skipped, not touched): ${alreadyLinked}`);

  await db.sequelize.close();
  process.exit(totalFailed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Backfill script crashed:', e);
  process.exit(1);
});
