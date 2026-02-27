const db = require('./src/models');

async function runMigration() {
  try {
    console.log('Creating material_types table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS material_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);

    console.log('Creating deal_inspection_requests table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_inspection_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        material_type_id INT NULL,
        quantity VARCHAR(100) NULL,
        safety_tools_required TINYINT(1) DEFAULT 0,
        supporting_documents TEXT NULL,
        requested_by INT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_deal_id (deal_id)
      )
    `);

    console.log('Adding columns to deal_inspection_requests...');
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN location VARCHAR(255) NULL`);
    } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN gate_pass_requirement VARCHAR(10) NULL`);
    } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN service_type VARCHAR(50) NULL`);
    } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }

    console.log('Creating deal_inspection_reports table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_inspection_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        inspection_datetime DATETIME NULL,
        approximate_weight DECIMAL(15,2) NULL,
        weight_uom VARCHAR(20) NULL,
        cargo_type VARCHAR(50) NULL,
        transportation_arrangement VARCHAR(50) NULL,
        approximate_value DECIMAL(15,2) NULL,
        images TEXT NULL,
        inspector_id INT NULL,
        approved_by_id INT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_deal_id (deal_id)
      )
    `);

    console.log('Creating deal_images table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        display_order INT DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_deal_id (deal_id)
      )
    `);

    console.log('Inserting default material types...');
    await db.sequelize.query(`
      INSERT IGNORE INTO material_types (value, display_name, display_order, is_active, created_at, updated_at)
      VALUES
        ('metal', 'Metal', 1, 1, NOW(), NOW()),
        ('plastic', 'Plastic', 2, 1, NOW(), NOW()),
        ('paper', 'Paper', 3, 1, NOW(), NOW()),
        ('glass', 'Glass', 4, 1, NOW(), NOW()),
        ('organic', 'Organic', 5, 1, NOW(), NOW()),
        ('electronic', 'Electronic', 6, 1, NOW(), NOW()),
        ('hazardous', 'Hazardous', 7, 1, NOW(), NOW()),
        ('other', 'Other', 99, 1, NOW(), NOW())
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
