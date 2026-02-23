/**
 * Migration to drop deals tables and create dropdown_values table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop deal_stages table first (it references deals)
    await queryInterface.dropTable('deal_stages');
    
    // Remove converted_to_deal_id column from leads table (which references deals)
    try {
      await queryInterface.removeColumn('leads', 'converted_to_deal_id');
    } catch (err) {
      console.log('Column may already be removed, continuing...');
    }
    
    // Now we can drop deals table
    await queryInterface.dropTable('deals');
    
    // Remove 'deals' from permissions module enum
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions 
      MODIFY COLUMN module ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads')
    `);
    
    // Create dropdown_values table
    await queryInterface.createTable('dropdown_values', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Category of dropdown: industry_types, cities, designations, etc.',
      },
      value: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'The actual dropdown value',
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Display name for the dropdown',
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Order in which to display the values',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'NULL for global dropdowns, specific tenant_id for tenant-specific',
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
    await queryInterface.addIndex('dropdown_values', ['category']);
    await queryInterface.addIndex('dropdown_values', ['tenant_id']);
    await queryInterface.addIndex('dropdown_values', ['category', 'is_active']);
    
    // Seed default dropdown values
    const now = new Date();
    
    const dropdownValues = [
      // Industry Types
      { category: 'industry_types', value: 'Technology', display_name: 'Technology', display_order: 1 },
      { category: 'industry_types', value: 'Manufacturing', display_name: 'Manufacturing', display_order: 2 },
      { category: 'industry_types', value: 'Retail', display_name: 'Retail', display_order: 3 },
      { category: 'industry_types', value: 'Healthcare', display_name: 'Healthcare', display_order: 4 },
      { category: 'industry_types', value: 'Finance', display_name: 'Finance', display_order: 5 },
      { category: 'industry_types', value: 'Construction', display_name: 'Construction', display_order: 6 },
      { category: 'industry_types', value: 'Education', display_name: 'Education', display_order: 7 },
      { category: 'industry_types', value: 'Transportation & Logistics', display_name: 'Transportation & Logistics', display_order: 8 },
      { category: 'industry_types', value: 'Energy', display_name: 'Energy', display_order: 9 },
      { category: 'industry_types', value: 'Real Estate', display_name: 'Real Estate', display_order: 10 },
      { category: 'industry_types', value: 'Hospitality', display_name: 'Hospitality', display_order: 11 },
      { category: 'industry_types', value: 'Agriculture', display_name: 'Agriculture', display_order: 12 },
      { category: 'industry_types', value: 'Environmental Services', display_name: 'Environmental Services', display_order: 13 },
      { category: 'industry_types', value: 'Other', display_name: 'Other', display_order: 14 },
      
      // UAE Cities
      { category: 'uae_cities', value: 'Dubai', display_name: 'Dubai', display_order: 1 },
      { category: 'uae_cities', value: 'Abu Dhabi', display_name: 'Abu Dhabi', display_order: 2 },
      { category: 'uae_cities', value: 'Sharjah', display_name: 'Sharjah', display_order: 3 },
      { category: 'uae_cities', value: 'Ajman', display_name: 'Ajman', display_order: 4 },
      { category: 'uae_cities', value: 'Ras Al Khaimah', display_name: 'Ras Al Khaimah', display_order: 5 },
      { category: 'uae_cities', value: 'Fujairah', display_name: 'Fujairah', display_order: 6 },
      { category: 'uae_cities', value: 'Umm Al Quwain', display_name: 'Umm Al Quwain', display_order: 7 },
      { category: 'uae_cities', value: 'Al Ain', display_name: 'Al Ain', display_order: 8 },
      
      // Designations
      { category: 'designations', value: 'CEO', display_name: 'CEO', display_order: 1 },
      { category: 'designations', value: 'Managing Director', display_name: 'Managing Director', display_order: 2 },
      { category: 'designations', value: 'Director', display_name: 'Director', display_order: 3 },
      { category: 'designations', value: 'General Manager', display_name: 'General Manager', display_order: 4 },
      { category: 'designations', value: 'Manager', display_name: 'Manager', display_order: 5 },
      { category: 'designations', value: 'Assistant Manager', display_name: 'Assistant Manager', display_order: 6 },
      { category: 'designations', value: 'Senior Executive', display_name: 'Senior Executive', display_order: 7 },
      { category: 'designations', value: 'Executive', display_name: 'Executive', display_order: 8 },
      { category: 'designations', value: 'Officer', display_name: 'Officer', display_order: 9 },
      { category: 'designations', value: 'Coordinator', display_name: 'Coordinator', display_order: 10 },
      { category: 'designations', value: 'Supervisor', display_name: 'Supervisor', display_order: 11 },
      { category: 'designations', value: 'Team Leader', display_name: 'Team Leader', display_order: 12 },
      { category: 'designations', value: 'Specialist', display_name: 'Specialist', display_order: 13 },
      { category: 'designations', value: 'Consultant', display_name: 'Consultant', display_order: 14 },
      { category: 'designations', value: 'Engineer', display_name: 'Engineer', display_order: 15 },
      { category: 'designations', value: 'Technician', display_name: 'Technician', display_order: 16 },
      { category: 'designations', value: 'Administrator', display_name: 'Administrator', display_order: 17 },
      { category: 'designations', value: 'Accountant', display_name: 'Accountant', display_order: 18 },
      { category: 'designations', value: 'Other', display_name: 'Other', display_order: 19 },
      
      // Contact Roles
      { category: 'contact_roles', value: 'Sales', display_name: 'Sales', display_order: 1 },
      { category: 'contact_roles', value: 'Finance', display_name: 'Finance', display_order: 2 },
      { category: 'contact_roles', value: 'HR', display_name: 'HR', display_order: 3 },
      { category: 'contact_roles', value: 'Operations', display_name: 'Operations', display_order: 4 },
      { category: 'contact_roles', value: 'Technical', display_name: 'Technical', display_order: 5 },
      { category: 'contact_roles', value: 'Management', display_name: 'Management', display_order: 6 },
      { category: 'contact_roles', value: 'Other', display_name: 'Other', display_order: 7 },
      
      // Lead Sources
      { category: 'lead_sources', value: 'Website', display_name: 'Website', display_order: 1 },
      { category: 'lead_sources', value: 'Referral', display_name: 'Referral', display_order: 2 },
      { category: 'lead_sources', value: 'Cold Call', display_name: 'Cold Call', display_order: 3 },
      { category: 'lead_sources', value: 'Email', display_name: 'Email', display_order: 4 },
      { category: 'lead_sources', value: 'Social Media', display_name: 'Social Media', display_order: 5 },
      { category: 'lead_sources', value: 'Trade Show', display_name: 'Trade Show', display_order: 6 },
      { category: 'lead_sources', value: 'Advertisement', display_name: 'Advertisement', display_order: 7 },
      { category: 'lead_sources', value: 'Partner', display_name: 'Partner', display_order: 8 },
      { category: 'lead_sources', value: 'Other', display_name: 'Other', display_order: 9 },
      
      // Service Interests
      { category: 'service_interests', value: 'Waste Collection', display_name: 'Waste Collection', display_order: 1 },
      { category: 'service_interests', value: 'Recycling', display_name: 'Recycling', display_order: 2 },
      { category: 'service_interests', value: 'Disposal', display_name: 'Disposal', display_order: 3 },
      { category: 'service_interests', value: 'ITAD Services', display_name: 'ITAD Services', display_order: 4 },
      { category: 'service_interests', value: 'Hazardous Waste', display_name: 'Hazardous Waste', display_order: 5 },
      { category: 'service_interests', value: 'Consulting', display_name: 'Consulting', display_order: 6 },
      { category: 'service_interests', value: 'Other', display_name: 'Other', display_order: 7 },
      
      // Countries
      { category: 'countries', value: 'UAE', display_name: 'United Arab Emirates', display_order: 1 },
      
      // Status Values
      { category: 'status', value: 'active', display_name: 'Active', display_order: 1 },
      { category: 'status', value: 'inactive', display_name: 'Inactive', display_order: 2 },
    ];
    
    // Add timestamps to all values
    const valuesToInsert = dropdownValues.map(v => ({
      ...v,
      is_active: true,
      tenant_id: null, // Global dropdowns
      created_at: now,
      updated_at: now,
    }));
    
    await queryInterface.bulkInsert('dropdown_values', valuesToInsert);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop dropdown_values table
    await queryInterface.dropTable('dropdown_values');
    
    // Add back converted_to_deal_id column to leads table
    await queryInterface.addColumn('leads', 'converted_to_deal_id', {
      type: Sequelize.INTEGER,
      references: { model: 'deals', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    
    // Recreate deals table
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
    
    // Recreate deal_stages table
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
    
    // Add back 'deals' to permissions module enum
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions 
      MODIFY COLUMN module ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads', 'deals')
    `);
  },
};
