/**
 * Database Seeder
 * Creates default permissions and assigns them to roles
 */
const db = require('../models');
const { MODULE, PERMISSION_ACTION } = require('../constants');

const createPermissions = async () => {
  console.log('Creating permissions...');

  const permissions = [];

  // Define modules and their actions
  const modules = Object.values(MODULE);
  const actions = Object.values(PERMISSION_ACTION);

  // Create permissions for each module and action combination
  for (const module of modules) {
    for (const action of actions) {
      const name = `${module}.${action}`;
      const displayName = `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`;
      
      permissions.push({
        name,
        display_name: displayName,
        module,
        action,
        description: `Permission to ${action} ${module}`,
      });
    }
  }

  // Bulk create permissions (ignore duplicates)
  try {
    const createdPermissions = await db.Permission.bulkCreate(permissions, {
      ignoreDuplicates: true,
      validate: true,
    });
    console.log(`✅ Created ${createdPermissions.length} permissions`);
    return createdPermissions;
  } catch (error) {
    console.error('Error creating permissions:', error.message);
    throw error;
  }
};

const assignPermissionsToAdminRoles = async () => {
  console.log('Assigning permissions to admin roles...');

  // Get all permissions
  const allPermissions = await db.Permission.findAll();
  console.log(`Found ${allPermissions.length} permissions`);

  // Get all tenant_admin roles
  const adminRoles = await db.Role.findAll({
    where: { name: 'tenant_admin' },
  });

  console.log(`Found ${adminRoles.length} tenant_admin roles`);

  // Assign all permissions to each admin role
  for (const role of adminRoles) {
    await role.setPermissions(allPermissions);
    console.log(`✅ Assigned ${allPermissions.length} permissions to role ID ${role.id} (${role.display_name})`);
  }
};

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create permissions
    await createPermissions();

    // Assign permissions to admin roles
    await assignPermissionsToAdminRoles();

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder
seed();
