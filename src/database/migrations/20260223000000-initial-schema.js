/**
 * Initial Database Schema Migration
 * Creates all tables for the ClearEarth ERP system
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create tenants table
    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      address: {
        type: Sequelize.TEXT,
      },
      city: {
        type: Sequelize.STRING(100),
      },
      country: {
        type: Sequelize.STRING(100),
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      subscription_plan: {
        type: Sequelize.STRING(50),
      },
      subscription_expires_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      is_system_role: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      username: {
        type: Sequelize.STRING(100),
        unique: true,
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
      },
      last_name: {
        type: Sequelize.STRING(100),
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'),
        defaultValue: 'active',
      },
      last_login_at: {
        type: Sequelize.DATE,
      },
      password_changed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create permissions table
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      module: {
        type: Sequelize.ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads', 'deals'),
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM('create', 'read', 'update', 'delete', 'approve', 'reject'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
    });

    // Create role_permissions table
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING(100),
      },
      entity_id: {
        type: Sequelize.INTEGER,
      },
      old_values: {
        type: Sequelize.JSON,
      },
      new_values: {
        type: Sequelize.JSON,
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
      user_agent: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create companies table FIRST (before contacts)
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      website: {
        type: Sequelize.STRING(255),
      },
      industry_type: {
        type: Sequelize.STRING(100),
      },
      address_line1: {
        type: Sequelize.STRING(255),
      },
      address_line2: {
        type: Sequelize.STRING(255),
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING(20),
      },
      primary_contact_id: {
        type: Sequelize.INTEGER,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create contacts table (after companies)
    await queryInterface.createTable('contacts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      mobile: {
        type: Sequelize.STRING(20),
      },
      designation: {
        type: Sequelize.STRING(150),
      },
      company_id: {
        type: Sequelize.INTEGER,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create company_contacts table (junction)
    await queryInterface.createTable('company_contacts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      contact_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'contacts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.STRING(100),
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create suppliers table
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      website: {
        type: Sequelize.STRING(255),
      },
      industry_type: {
        type: Sequelize.STRING(100),
      },
      address_line1: {
        type: Sequelize.STRING(255),
      },
      address_line2: {
        type: Sequelize.STRING(255),
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING(20),
      },
      primary_contact_id: {
        type: Sequelize.INTEGER,
        references: { model: 'contacts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create supplier_contacts table (junction)
    await queryInterface.createTable('supplier_contacts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      contact_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'contacts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.STRING(100),
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create leads table
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      lead_number: {
        type: Sequelize.STRING(50),
        unique: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      contact_id: {
        type: Sequelize.INTEGER,
        references: { model: 'contacts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      email: {
        type: Sequelize.STRING(100),
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      source: {
        type: Sequelize.STRING(100),
      },
      service_interest: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      estimated_value: {
        type: Sequelize.DECIMAL(15, 2),
      },
      notes: {
        type: Sequelize.TEXT,
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'qualified', 'disqualified', 'converted'),
        defaultValue: 'new',
      },
      qualification_notes: {
        type: Sequelize.TEXT,
      },
      disqualification_reason: {
        type: Sequelize.TEXT,
      },
      converted_to_deal_id: {
        type: Sequelize.INTEGER,
        references: { model: 'deals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      converted_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create deals table
    await queryInterface.createTable('deals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      deal_number: {
        type: Sequelize.STRING(50),
        unique: true,
      },
      lead_id: {
        type: Sequelize.INTEGER,
        references: { model: 'leads', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      client_id: {
        type: Sequelize.INTEGER,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deal_type: {
        type: Sequelize.ENUM('offer_to_purchase', 'free_of_cost', 'offer_to_service'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      service_type: {
        type: Sequelize.JSON,
      },
      expected_value: {
        type: Sequelize.DECIMAL(15, 2),
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      expected_closure_date: {
        type: Sequelize.DATE,
      },
      actual_closure_date: {
        type: Sequelize.DATE,
      },
      probability: {
        type: Sequelize.INTEGER,
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      current_stage: {
        type: Sequelize.ENUM('sales', 'operations', 'finance', 'logistics', 'warehouse', 'completed'),
      },
      current_department: {
        type: Sequelize.STRING(50),
      },
      handler_user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('draft', 'negotiation', 'pending_approval', 'approved', 'won', 'lost', 'cancelled'),
        defaultValue: 'draft',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
      },
      approval_notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Create deal_stages table
    await queryInterface.createTable('deal_stages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      deal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stage_name: {
        type: Sequelize.ENUM('sales', 'operations', 'finance', 'logistics', 'warehouse', 'completed'),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(50),
      },
      handler_user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      started_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Add indexes
    await queryInterface.addIndex('tenants', ['tenant_code'], { unique: true });
    await queryInterface.addIndex('tenants', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['tenant_id']);
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role_id']);
    await queryInterface.addIndex('roles', ['tenant_id']);
    await queryInterface.addIndex('permissions', ['module']);
    await queryInterface.addIndex('permissions', ['action']);
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], { unique: true });
    await queryInterface.addIndex('contacts', ['tenant_id']);
    await queryInterface.addIndex('contacts', ['company_id']);
    await queryInterface.addIndex('companies', ['tenant_id']);
    await queryInterface.addIndex('company_contacts', ['company_id', 'contact_id'], { unique: true });
    await queryInterface.addIndex('suppliers', ['tenant_id']);
    await queryInterface.addIndex('supplier_contacts', ['supplier_id', 'contact_id'], { unique: true });
    await queryInterface.addIndex('leads', ['tenant_id']);
    await queryInterface.addIndex('leads', ['lead_number'], { unique: true });
    await queryInterface.addIndex('leads', ['company_id']);
    await queryInterface.addIndex('leads', ['contact_id']);
    await queryInterface.addIndex('leads', ['assigned_to']);
    await queryInterface.addIndex('leads', ['status']);
    await queryInterface.addIndex('deals', ['tenant_id']);
    await queryInterface.addIndex('deals', ['deal_number'], { unique: true });
    await queryInterface.addIndex('deals', ['lead_id']);
    await queryInterface.addIndex('deals', ['client_id']);
    await queryInterface.addIndex('deals', ['assigned_to']);
    await queryInterface.addIndex('deals', ['status']);
    await queryInterface.addIndex('deal_stages', ['deal_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('deal_stages');
    await queryInterface.dropTable('deals');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('supplier_contacts');
    await queryInterface.dropTable('suppliers');
    await queryInterface.dropTable('company_contacts');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('tenants');
  },
};
