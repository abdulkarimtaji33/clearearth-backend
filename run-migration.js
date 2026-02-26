const db = require('./src/models');

async function runMigration() {
  try {
    console.log('Adding deal_type column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN deal_type ENUM('offer_to_charge', 'offer_to_purchase', 'free_of_charge') 
      NOT NULL DEFAULT 'offer_to_purchase' AFTER terms_and_conditions_id
    `);
    
    console.log('Adding container_type column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN container_type ENUM('LCL', 'FCL') NULL AFTER deal_type
    `);
    
    console.log('Adding location_type column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN location_type ENUM('Main Land', 'Free Zone') NULL AFTER container_type
    `);
    
    console.log('Adding wds_required column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN wds_required TINYINT(1) DEFAULT 0 AFTER location_type
    `);
    
    console.log('Adding inspection_required column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN inspection_required TINYINT(1) DEFAULT 0 AFTER wds_required
    `);
    
    console.log('Adding custom_inspection column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN custom_inspection TINYINT(1) DEFAULT 0 AFTER inspection_required
    `);
    
    console.log('Adding trakhees_inspection column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN trakhees_inspection TINYINT(1) DEFAULT 0 AFTER custom_inspection
    `);
    
    console.log('Adding dubai_municipality_inspection column...');
    await db.sequelize.query(`
      ALTER TABLE deals ADD COLUMN dubai_municipality_inspection TINYINT(1) DEFAULT 0 AFTER trakhees_inspection
    `);
    
    console.log('Creating deal_wds table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_wds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        ref_no VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        license_no VARCHAR(100) NOT NULL,
        waste_description TEXT NOT NULL,
        source_process TEXT,
        package_type VARCHAR(100),
        quantity_per_package VARCHAR(100),
        total_weight VARCHAR(100),
        container_no VARCHAR(100) NOT NULL,
        purpose TEXT,
        bl_no VARCHAR(100),
        bor_no VARCHAR(100),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_deal_id (deal_id),
        INDEX idx_ref_no (ref_no)
      ) ENGINE=InnoDB
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
