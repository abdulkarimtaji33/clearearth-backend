const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

async function checkNewTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    const requiredTables = ['dropdown_values', 'products_services', 'deal_items'];
    
    for (const table of requiredTables) {
      try {
        const [results] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
        if (results.length > 0) {
          console.log(`✅ ${table} - EXISTS`);
          
          const [columns] = await sequelize.query(`DESCRIBE ${table}`);
          console.log(`   Columns: ${columns.map(c => c.Field).join(', ')}\n`);
        } else {
          console.log(`❌ ${table} - MISSING\n`);
        }
      } catch (err) {
        console.log(`❌ ${table} - ERROR: ${err.message}\n`);
      }
    }

    // Check if leads has product_service_id column
    const [leadsColumns] = await sequelize.query(`DESCRIBE leads`);
    const hasProductServiceId = leadsColumns.some(c => c.Field === 'product_service_id');
    console.log(`\nLeads table has product_service_id: ${hasProductServiceId ? '✅ YES' : '❌ NO'}`);
    
    // Check current deals table structure
    console.log('\n📋 Current deals table structure:');
    const [dealsColumns] = await sequelize.query(`DESCRIBE deals`);
    console.log('Columns:', dealsColumns.map(c => c.Field).join(', '));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkNewTables();
