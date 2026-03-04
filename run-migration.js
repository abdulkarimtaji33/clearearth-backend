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
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN location_type VARCHAR(50) NULL`);
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

    console.log('Creating deal_terms table (multi-select Terms & Conditions)...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        terms_and_conditions_id INT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_deal_id (deal_id),
        INDEX idx_terms_id (terms_and_conditions_id),
        UNIQUE KEY uk_deal_terms (deal_id, terms_and_conditions_id)
      )
    `);

    console.log('Migrating existing deal terms...');
    try {
      const [deals] = await db.sequelize.query(`
        SELECT id, terms_and_conditions_id FROM deals 
        WHERE terms_and_conditions_id IS NOT NULL AND deleted_at IS NULL
      `);
      if (deals && deals.length > 0) {
        for (const d of deals) {
          await db.sequelize.query(`
            INSERT IGNORE INTO deal_terms (deal_id, terms_and_conditions_id, sort_order, created_at, updated_at)
            VALUES (?, ?, 0, NOW(), NOW())
          `, { replacements: [d.id, d.terms_and_conditions_id] });
        }
        console.log(`  Migrated ${deals.length} deal(s) to deal_terms`);
      }
    } catch (e) {
      console.warn('  Could not migrate existing deal terms:', e.message);
    }

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

    console.log('Creating quotations table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        deal_id INT NOT NULL,
        prepared_by INT NOT NULL,
        quotation_date DATE NOT NULL,
        quotation_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'AED',
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        remarks TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_deal_id (deal_id),
        INDEX idx_prepared_by (prepared_by),
        INDEX idx_status (status)
      )
    `);

    console.log('Creating quotation_statuses table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quotation_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    await db.sequelize.query(`
      INSERT IGNORE INTO quotation_statuses (value, display_name, display_order, is_active, created_at, updated_at)
      VALUES
        ('draft', 'Draft', 1, 1, NOW(), NOW()),
        ('sent', 'Sent', 2, 1, NOW(), NOW()),
        ('approved', 'Approved', 3, 1, NOW(), NOW()),
        ('rejected', 'Rejected', 4, 1, NOW(), NOW())
    `);

    console.log('Creating purchase_orders table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        supplier_id INT NOT NULL,
        po_date DATE NOT NULL,
        expected_delivery VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_supplier_id (supplier_id)
      )
    `);

    console.log('Creating purchase_order_items table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        product_service_id INT NOT NULL,
        item_description TEXT NULL,
        quantity VARCHAR(100) NOT NULL,
        price VARCHAR(100) NOT NULL,
        total VARCHAR(100) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_purchase_order_id (purchase_order_id)
      )
    `);

    console.log('Creating purchase_order_terms table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        terms_and_conditions_id INT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_purchase_order_id (purchase_order_id),
        UNIQUE KEY uk_po_terms (purchase_order_id, terms_and_conditions_id)
      )
    `);

    console.log('Creating purchase_order_statuses table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_statuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    await db.sequelize.query(`
      INSERT IGNORE INTO purchase_order_statuses (value, display_name, display_order, is_active, created_at, updated_at)
      VALUES
        ('draft', 'Draft', 1, 1, NOW(), NOW()),
        ('sent', 'Sent', 2, 1, NOW(), NOW()),
        ('approved', 'Approved', 3, 1, NOW(), NOW()),
        ('rejected', 'Rejected', 4, 1, NOW(), NOW()),
        ('delivered', 'Delivered', 5, 1, NOW(), NOW())
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
