/**
 * Database Seeder
 * Creates default permissions and assigns them to roles
 */
const db = require('../models');
const { MODULES, ACTIONS, SCOPED_MODULES, SCOPED_ACTIONS, SCOPES, FINANCIAL_MODULES, PRICE_ACTION } = require('../constants');

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

const buildPermissions = () => {
  const permissions = [];
  const seen = new Set();

  const add = ({ module, action, scope = null }) => {
    const name = scope ? `${module}.${action}.${scope}` : `${module}.${action}`;
    if (seen.has(name)) return;
    seen.add(name);
    const displayName = scope
      ? `${titleCase(action)} ${titleCase(module)} (${titleCase(scope)})`
      : `${titleCase(action)} ${titleCase(module)}`;
    permissions.push({
      name,
      display_name: displayName,
      module,
      action,
      scope,
      description: scope
        ? `Permission to ${action} ${scope === 'own' ? 'own' : 'all'} ${module}`
        : `Permission to ${action} ${module}`,
    });
  };

  const modules = Object.values(MODULES);
  const actions = Object.values(ACTIONS);

  for (const module of modules) {
    for (const action of actions) {
      if (SCOPED_MODULES.includes(module) && SCOPED_ACTIONS.includes(action)) {
        add({ module, action, scope: SCOPES.OWN });
        add({ module, action, scope: SCOPES.ALL });
      } else {
        add({ module, action });
      }
    }
  }

  for (const module of FINANCIAL_MODULES) {
    add({ module, action: PRICE_ACTION });
  }

  return permissions;
};

const createPermissions = async () => {
  console.log('Creating permissions...');

  const permissions = buildPermissions();

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
