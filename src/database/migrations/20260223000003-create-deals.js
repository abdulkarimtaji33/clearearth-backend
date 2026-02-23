/**
 * Create Deals Module
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        comment: 'Auto-generated deal reference number',
      },
      lead_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'leads', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Optional link to originating lead',
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Client company',
      },
      contact_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'contacts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Client contact person',
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Supplier involved in deal',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      deal_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Date of the deal',
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Sum of all line items before VAT',
      },
      vat_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 5.00,
        comment: 'VAT percentage (e.g., 5% in UAE)',
      },
      vat_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Calculated VAT amount',
      },
      total: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Total amount including VAT',
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'draft',
      },
      payment_status: {
        type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
        defaultValue: 'unpaid',
      },
      paid_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Total amount paid so far',
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User responsible for this deal',
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

    // Create deal_items table (for multiple products/services)
    await queryInterface.createTable('deal_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products_services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00,
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Price per unit at time of deal',
      },
      line_total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'quantity * unit_price',
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
    await queryInterface.addIndex('deals', ['tenant_id']);
    await queryInterface.addIndex('deals', ['deal_number'], { unique: true });
    await queryInterface.addIndex('deals', ['lead_id']);
    await queryInterface.addIndex('deals', ['company_id']);
    await queryInterface.addIndex('deals', ['supplier_id']);
    await queryInterface.addIndex('deals', ['status']);
    await queryInterface.addIndex('deals', ['payment_status']);
    await queryInterface.addIndex('deals', ['assigned_to']);
    await queryInterface.addIndex('deal_items', ['deal_id']);
    await queryInterface.addIndex('deal_items', ['product_service_id']);

    // Add deal status values to dropdown_values
    const now = new Date();
    const statuses = [
      { category: 'deal_status', value: 'draft', display_name: 'Draft', display_order: 1 },
      { category: 'deal_status', value: 'pending', display_name: 'Pending Approval', display_order: 2 },
      { category: 'deal_status', value: 'approved', display_name: 'Approved', display_order: 3 },
      { category: 'deal_status', value: 'in_progress', display_name: 'In Progress', display_order: 4 },
      { category: 'deal_status', value: 'completed', display_name: 'Completed', display_order: 5 },
      { category: 'deal_status', value: 'cancelled', display_name: 'Cancelled', display_order: 6 },
      
      { category: 'payment_status', value: 'unpaid', display_name: 'Unpaid', display_order: 1 },
      { category: 'payment_status', value: 'partial', display_name: 'Partially Paid', display_order: 2 },
      { category: 'payment_status', value: 'paid', display_name: 'Fully Paid', display_order: 3 },
    ];

    const valuesToInsert = statuses.map(v => ({
      ...v,
      is_active: true,
      tenant_id: null,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('dropdown_values', valuesToInsert);

    // Update permissions module to include deals
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions 
      MODIFY COLUMN module ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads', 'products', 'deals')
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('deal_items');
    await queryInterface.dropTable('deals');
    
    // Remove dropdown values
    await queryInterface.sequelize.query(`
      DELETE FROM dropdown_values WHERE category IN ('deal_status', 'payment_status')
    `);
    
    // Remove deals from permissions module
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions 
      MODIFY COLUMN module ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads', 'products')
    `);
  },
};
