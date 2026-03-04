/**
 * Create Sales Manager, Inspection Team, and Sales users in admin@clearearth.com tenant.
 * Run: node create-sales-users.js
 *
 * Default password for all: ClearEarth123!
 */
const db = require('./src/models');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = 'ClearEarth123!';

const USERS_TO_CREATE = [
  {
    email: 'salesmanager@clearearth.com',
    username: 'salesmanager',
    firstName: 'Sales',
    lastName: 'Manager',
    roleName: 'sales_manager',
  },
  {
    email: 'inspection@clearearth.com',
    username: 'inspection',
    firstName: 'Inspection',
    lastName: 'User',
    roleName: 'inspection_team',
  },
  {
    email: 'sales@clearearth.com',
    username: 'sales',
    firstName: 'Sales',
    lastName: 'Representative',
    roleName: 'sales',
  },
];

async function createSalesUsers() {
  try {
    console.log('Finding admin@clearearth.com tenant...');
    const adminUser = await db.User.findOne({
      where: { email: 'admin@clearearth.com' },
      attributes: ['id', 'tenant_id'],
    });

    if (!adminUser) {
      console.error('❌ admin@clearearth.com not found. Create that user first or use a different admin email.');
      process.exit(1);
    }

    const tenantId = adminUser.tenant_id;
    console.log(`  Tenant ID: ${tenantId}`);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const u of USERS_TO_CREATE) {
      const role = await db.Role.findOne({
        where: { name: u.roleName, tenant_id: null },
      });

      if (!role) {
        console.warn(`  ⚠️ Role '${u.roleName}' not found, skipping ${u.email}`);
        continue;
      }

      const [user, created] = await db.User.findOrCreate({
        where: { tenant_id: tenantId, email: u.email },
        defaults: {
          tenant_id: tenantId,
          role_id: role.id,
          username: u.username,
          email: u.email,
          password: hashedPassword,
          first_name: u.firstName,
          last_name: u.lastName,
          status: 'active',
          email_verified_at: new Date(),
        },
      });

      if (created) {
        console.log(`  ✅ Created: ${u.email} (${u.roleName})`);
      } else {
        console.log(`  ⏭️ Exists: ${u.email} (${u.roleName})`);
      }
    }

    console.log('\n✅ Done! Credentials (password for all): ' + DEFAULT_PASSWORD);
    console.log('   - salesmanager@clearearth.com (Sales Manager)');
    console.log('   - inspection@clearearth.com (Inspection Team)');
    console.log('   - sales@clearearth.com (Sales)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSalesUsers();
