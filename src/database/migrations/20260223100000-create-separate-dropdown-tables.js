/**
 * Create Separate Dropdown Tables
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing tables if they exist (from initial schema)
    const tablesToDrop = [
      'designations', 'industry_types', 'uae_cities', 'countries', 
      'lead_sources', 'contact_roles', 'service_interests', 
      'product_categories', 'units_of_measure', 'deal_statuses', 
      'payment_statuses', 'statuses'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await queryInterface.dropTable(table);
      } catch (err) {
        console.log(`Table ${table} may not exist, continuing...`);
      }
    }

    // 1. Designations Table
    await queryInterface.createTable('designations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 2. Industry Types Table
    await queryInterface.createTable('industry_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 3. UAE Cities Table
    await queryInterface.createTable('uae_cities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 4. Countries Table
    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 5. Lead Sources Table
    await queryInterface.createTable('lead_sources', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 6. Contact Roles Table
    await queryInterface.createTable('contact_roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 7. Service Interests Table
    await queryInterface.createTable('service_interests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 8. Product Categories Table
    await queryInterface.createTable('product_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 9. Units of Measure Table
    await queryInterface.createTable('units_of_measure', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 10. Deal Status Table
    await queryInterface.createTable('deal_statuses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 11. Payment Status Table
    await queryInterface.createTable('payment_statuses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 12. Status Table (Generic Active/Inactive)
    await queryInterface.createTable('statuses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Migrate data from dropdown_values to respective tables
    const timestamp = new Date();
    
    // Copy designations
    await queryInterface.sequelize.query(`
      INSERT INTO designations (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'designations'
    `);

    // Copy industry_types
    await queryInterface.sequelize.query(`
      INSERT INTO industry_types (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'industry_types'
    `);

    // Copy uae_cities
    await queryInterface.sequelize.query(`
      INSERT INTO uae_cities (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'uae_cities'
    `);

    // Copy countries
    await queryInterface.sequelize.query(`
      INSERT INTO countries (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'countries'
    `);

    // Copy lead_sources
    await queryInterface.sequelize.query(`
      INSERT INTO lead_sources (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'lead_sources'
    `);

    // Copy contact_roles
    await queryInterface.sequelize.query(`
      INSERT INTO contact_roles (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'contact_roles'
    `);

    // Copy service_interests
    await queryInterface.sequelize.query(`
      INSERT INTO service_interests (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'service_interests'
    `);

    // Copy product_categories
    await queryInterface.sequelize.query(`
      INSERT INTO product_categories (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'product_categories'
    `);

    // Copy units_of_measure
    await queryInterface.sequelize.query(`
      INSERT INTO units_of_measure (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'units_of_measure'
    `);

    // Copy deal_status to deal_statuses
    await queryInterface.sequelize.query(`
      INSERT INTO deal_statuses (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'deal_status'
    `);

    // Copy payment_status to payment_statuses
    await queryInterface.sequelize.query(`
      INSERT INTO payment_statuses (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'payment_status'
    `);

    // Copy status to statuses
    await queryInterface.sequelize.query(`
      INSERT INTO statuses (value, display_name, display_order, is_active, created_at, updated_at)
      SELECT value, display_name, display_order, is_active, '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}', '${timestamp.toISOString().slice(0, 19).replace('T', ' ')}'
      FROM dropdown_values WHERE category = 'status'
    `);

    // Drop old dropdown_values table
    await queryInterface.dropTable('dropdown_values');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate dropdown_values table
    await queryInterface.createTable('dropdown_values', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Drop all separate tables
    await queryInterface.dropTable('designations');
    await queryInterface.dropTable('industry_types');
    await queryInterface.dropTable('uae_cities');
    await queryInterface.dropTable('countries');
    await queryInterface.dropTable('lead_sources');
    await queryInterface.dropTable('contact_roles');
    await queryInterface.dropTable('service_interests');
    await queryInterface.dropTable('product_categories');
    await queryInterface.dropTable('units_of_measure');
    await queryInterface.dropTable('deal_statuses');
    await queryInterface.dropTable('payment_statuses');
    await queryInterface.dropTable('statuses');
  },
};
