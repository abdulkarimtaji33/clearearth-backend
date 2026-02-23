/**
 * Database Constraints & Relationships Test
 */
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

async function testDatabaseConstraints() {
  console.log('═══════════════════════════════════════');
  console.log('🗄️  DATABASE CONSTRAINTS & RELATIONSHIPS TEST');
  console.log('═══════════════════════════════════════\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Test 1: Check foreign keys
    console.log('📋 Testing Foreign Key Constraints:\n');
    
    const [fkResults] = await sequelize.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
      AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    console.log(`Found ${fkResults.length} foreign key constraints:\n`);
    
    const keyTables = ['dropdown_values', 'products_services', 'deals', 'deal_items', 'leads'];
    keyTables.forEach(table => {
      const tableFKs = fkResults.filter(fk => fk.TABLE_NAME === table);
      if (tableFKs.length > 0) {
        console.log(`  ${table}:`);
        tableFKs.forEach(fk => {
          console.log(`    ✓ ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
        console.log('');
      }
    });

    // Test 2: Check indexes
    console.log('\n📊 Testing Indexes:\n');
    
    const tablesToCheck = ['dropdown_values', 'products_services', 'deals', 'deal_items'];
    for (const table of tablesToCheck) {
      const [indexes] = await sequelize.query(`SHOW INDEX FROM ${table}`);
      console.log(`  ${table}: ${indexes.length} indexes`);
      const uniqueIndexes = indexes.filter(i => i.Non_unique === 0);
      if (uniqueIndexes.length > 0) {
        console.log(`    → ${uniqueIndexes.length} unique indexes (including PRIMARY)`);
      }
    }

    // Test 3: Check critical tables exist
    console.log('\n\n📦 Verifying New Tables:\n');
    
    const criticalTables = [
      'dropdown_values',
      'products_services',
      'deals',
      'deal_items'
    ];

    for (const table of criticalTables) {
      const [result] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
      if (result.length > 0) {
        const [columns] = await sequelize.query(`DESCRIBE ${table}`);
        console.log(`  ✅ ${table}: ${columns.length} columns`);
      } else {
        console.log(`  ❌ ${table}: MISSING`);
      }
    }

    // Test 4: Check dropdown data
    console.log('\n\n🎨 Verifying Dropdown Data:\n');
    
    const [dropdowns] = await sequelize.query(`
      SELECT category, COUNT(*) as count
      FROM dropdown_values
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);

    dropdowns.forEach(row => {
      console.log(`  ✓ ${row.category}: ${row.count} values`);
    });

    // Test 5: Verify products_services structure
    console.log('\n\n🔧 Verifying Products/Services Structure:\n');
    
    const [prodColumns] = await sequelize.query(`DESCRIBE products_services`);
    const requiredProdColumns = ['id', 'tenant_id', 'name', 'category', 'unit_of_measure', 'price', 'status'];
    requiredProdColumns.forEach(col => {
      const exists = prodColumns.some(c => c.Field === col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
    });

    // Test 6: Verify deals structure
    console.log('\n\n💼 Verifying Deals Structure:\n');
    
    const [dealColumns] = await sequelize.query(`DESCRIBE deals`);
    const requiredDealColumns = ['id', 'tenant_id', 'deal_number', 'lead_id', 'company_id', 'contact_id', 'supplier_id', 'subtotal', 'vat_amount', 'total', 'payment_status'];
    requiredDealColumns.forEach(col => {
      const exists = dealColumns.some(c => c.Field === col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
    });

    // Test 7: Verify deal_items structure
    console.log('\n\n📋 Verifying Deal Items Structure:\n');
    
    const [itemColumns] = await sequelize.query(`DESCRIBE deal_items`);
    const requiredItemColumns = ['id', 'deal_id', 'product_service_id', 'quantity', 'unit_price', 'line_total'];
    requiredItemColumns.forEach(col => {
      const exists = itemColumns.some(c => c.Field === col);
      console.log(`  ${exists ? '✓' : '✗'} ${col}`);
    });

    // Test 8: Check leads has product_service_id
    console.log('\n\n🎯 Verifying Leads Updates:\n');
    
    const [leadColumns] = await sequelize.query(`DESCRIBE leads`);
    const hasProductServiceId = leadColumns.some(c => c.Field === 'product_service_id');
    const hasConvertedToDealId = leadColumns.some(c => c.Field === 'converted_to_deal_id');
    
    console.log(`  ${hasProductServiceId ? '✓' : '✗'} product_service_id column added`);
    console.log(`  ${!hasConvertedToDealId ? '✓' : '✗'} converted_to_deal_id column removed`);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ DATABASE VALIDATION COMPLETE');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Database test error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testDatabaseConstraints();
