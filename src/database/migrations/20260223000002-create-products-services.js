/**
 * Create Products/Services table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create products_services table
    await queryInterface.createTable('products_services', {
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
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Product or Service category',
      },
      description: {
        type: Sequelize.TEXT,
      },
      unit_of_measure: {
        type: Sequelize.STRING(50),
        comment: 'kg, ton, piece, hour, etc.',
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
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

    // Add indexes
    await queryInterface.addIndex('products_services', ['tenant_id']);
    await queryInterface.addIndex('products_services', ['category']);
    await queryInterface.addIndex('products_services', ['status']);
    await queryInterface.addIndex('products_services', ['name']);

    // Update leads table - change service_interest to product_service_id
    await queryInterface.addColumn('leads', 'product_service_id', {
      type: Sequelize.INTEGER,
      references: { model: 'products_services', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Link to product/service',
    });

    // Add product/service categories to dropdown_values
    const now = new Date();
    const categories = [
      { category: 'product_categories', value: 'Waste Collection', display_name: 'Waste Collection', display_order: 1 },
      { category: 'product_categories', value: 'Recycling', display_name: 'Recycling', display_order: 2 },
      { category: 'product_categories', value: 'Disposal', display_name: 'Disposal', display_order: 3 },
      { category: 'product_categories', value: 'ITAD Services', display_name: 'ITAD Services', display_order: 4 },
      { category: 'product_categories', value: 'Hazardous Waste', display_name: 'Hazardous Waste', display_order: 5 },
      { category: 'product_categories', value: 'Consulting', display_name: 'Consulting', display_order: 6 },
      { category: 'product_categories', value: 'Equipment Rental', display_name: 'Equipment Rental', display_order: 7 },
      { category: 'product_categories', value: 'Other', display_name: 'Other', display_order: 8 },
      
      { category: 'units_of_measure', value: 'kg', display_name: 'Kilograms (kg)', display_order: 1 },
      { category: 'units_of_measure', value: 'ton', display_name: 'Tons (ton)', display_order: 2 },
      { category: 'units_of_measure', value: 'piece', display_name: 'Piece (pc)', display_order: 3 },
      { category: 'units_of_measure', value: 'hour', display_name: 'Hour (hr)', display_order: 4 },
      { category: 'units_of_measure', value: 'day', display_name: 'Day', display_order: 5 },
      { category: 'units_of_measure', value: 'month', display_name: 'Month', display_order: 6 },
      { category: 'units_of_measure', value: 'unit', display_name: 'Unit', display_order: 7 },
      { category: 'units_of_measure', value: 'service', display_name: 'Service', display_order: 8 },
    ];

    const valuesToInsert = categories.map(v => ({
      ...v,
      is_active: true,
      tenant_id: null,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('dropdown_values', valuesToInsert);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove product_service_id from leads
    await queryInterface.removeColumn('leads', 'product_service_id');
    
    // Drop products_services table
    await queryInterface.dropTable('products_services');
    
    // Remove dropdown values
    await queryInterface.sequelize.query(`
      DELETE FROM dropdown_values WHERE category IN ('product_categories', 'units_of_measure')
    `);
  },
};
