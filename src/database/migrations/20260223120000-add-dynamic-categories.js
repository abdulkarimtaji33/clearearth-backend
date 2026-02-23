module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert new categories based on existing product data
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Get unique categories from existing products
    const [existingCategories] = await queryInterface.sequelize.query(
      'SELECT DISTINCT category FROM products_services WHERE category IS NOT NULL AND category != ""'
    );
    
    // Insert unique categories into product_categories table
    for (const row of existingCategories) {
      if (row.category) {
        try {
          await queryInterface.sequelize.query(
            `INSERT IGNORE INTO product_categories (value, display_name, display_order, is_active, created_at, updated_at) 
             VALUES (?, ?, 0, 1, ?, ?)`,
            {
              replacements: [row.category, row.category, timestamp, timestamp]
            }
          );
        } catch (err) {
          console.log(`Category ${row.category} may already exist, skipping...`);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove categories that were added
    await queryInterface.sequelize.query(
      'DELETE FROM product_categories WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
  },
};