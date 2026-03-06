const db = require('./src/models');
const bcrypt = require('bcryptjs');

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

    console.log('Creating deal_wds_attachments table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS deal_wds_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_wds_id INT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_deal_wds_id (deal_wds_id)
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

    console.log('Adding deal_id to purchase_orders...');
    try { await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN deal_id INT NULL, ADD INDEX idx_deal_id (deal_id)`); } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }

    console.log('Adding companies.type, suppliers.type, contacts.last_name...');
    try { await db.sequelize.query(`ALTER TABLE contacts MODIFY last_name VARCHAR(100) NULL`); } catch (e) { if (!e.message?.includes('Duplicate') && !e.message?.includes('Unknown column')) throw e; }
    try { await db.sequelize.query(`ALTER TABLE companies ADD COLUMN type ENUM('individual','organization') DEFAULT 'organization'`); } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }
    try { await db.sequelize.query(`ALTER TABLE suppliers ADD COLUMN type ENUM('individual','organization') DEFAULT 'organization'`); } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }

    console.log('Adding vat_number to companies and suppliers...');
    try { await db.sequelize.query(`ALTER TABLE companies ADD COLUMN vat_number VARCHAR(50) NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }
    try { await db.sequelize.query(`ALTER TABLE suppliers ADD COLUMN vat_number VARCHAR(50) NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }

    console.log('Ensuring super_admin role exists...');
    const [existingSuperAdmin] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'super_admin' AND tenant_id IS NULL LIMIT 1`);
    if (!existingSuperAdmin || existingSuperAdmin.length === 0) {
      await db.sequelize.query(`
        INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
        VALUES (NULL, 'super_admin', 'Super Administrator', 'Full system access - manage roles, permissions, and users', 1, 'active', NOW(), NOW())
      `);
      console.log('  Created super_admin role');
    } else {
      console.log('  super_admin role already exists');
    }

    console.log('Ensuring super_admin user exists...');
    const SUPER_ADMIN_EMAIL = 'superadmin@clearearth.com';
    const SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';
    const [existingUser] = await db.sequelize.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, {
      replacements: [SUPER_ADMIN_EMAIL],
    });
    if (!existingUser || existingUser.length === 0) {
      const [roleRows] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'super_admin' AND tenant_id IS NULL LIMIT 1`);
      const [tenantRows] = await db.sequelize.query(`SELECT id FROM tenants LIMIT 1`);
      const superAdminRoleId = roleRows?.[0]?.id;
      const tenantId = tenantRows?.[0]?.id || 1;
      if (superAdminRoleId) {
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
        await db.sequelize.query(
          `INSERT INTO users (tenant_id, role_id, username, email, password, first_name, last_name, status, email_verified_at, created_at, updated_at)
           VALUES (?, ?, 'superadmin', ?, ?, 'Super', 'Admin', 'active', NOW(), NOW(), NOW())`,
          { replacements: [tenantId, superAdminRoleId, SUPER_ADMIN_EMAIL, hashedPassword] }
        );
        console.log('  Created super_admin user: ' + SUPER_ADMIN_EMAIL + ' / ' + SUPER_ADMIN_PASSWORD);
      } else {
        console.log('  Skipped super_admin user - role not found');
      }
    } else {
      console.log('  super_admin user already exists');
    }

    console.log('Adding inspection_requests and inspection_reports to permissions module enum...');
    try {
      await db.sequelize.query(`
        ALTER TABLE permissions MODIFY COLUMN module ENUM(
          'users','roles','contacts','companies','suppliers','leads','products','deals',
          'inspection_requests','inspection_reports'
        ) NOT NULL
      `);
    } catch (e) {
      if (!e.message?.includes('Duplicate') && !e.message?.includes('already exists')) console.warn('  Enum alter:', e.message);
    }

    console.log('Ensuring inspection permissions exist...');
    const inspectionPerms = [
      ['inspection_requests.read', 'Read Inspection Requests', 'inspection_requests', 'read'],
      ['inspection_reports.read', 'Read Inspection Reports', 'inspection_reports', 'read'],
      ['inspection_reports.create', 'Create Inspection Reports', 'inspection_reports', 'create'],
      ['inspection_reports.update', 'Update Inspection Reports', 'inspection_reports', 'update'],
    ];
    for (const [name, displayName, mod, act] of inspectionPerms) {
      try {
        await db.sequelize.query(
          `INSERT IGNORE INTO permissions (name, display_name, module, action, description) VALUES (?, ?, ?, ?, ?)`,
          { replacements: [name, displayName, mod, act, `Permission to ${act} ${mod.replace('_', ' ')}`] }
        );
      } catch (e) {
        if (!e.message?.includes('Duplicate') && !e.message?.includes('ER_DUP_ENTRY')) console.warn('  Perm insert:', e.message);
      }
    }

    console.log('Ensuring inspection_team role exists...');
    const [existingInspectionTeam] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'inspection_team' AND tenant_id IS NULL LIMIT 1`);
    if (!existingInspectionTeam || existingInspectionTeam.length === 0) {
      await db.sequelize.query(`
        INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
        VALUES (NULL, 'inspection_team', 'Inspection Team', 'View inspection requests and add inspection reports', 1, 'active', NOW(), NOW())
      `);
      const [[roleRow]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'inspection_team' AND tenant_id IS NULL LIMIT 1`);
      if (roleRow?.id) {
        const [permRows] = await db.sequelize.query(`SELECT id FROM permissions WHERE module IN ('inspection_requests','inspection_reports')`);
        for (const p of permRows || []) {
          try {
            await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, {
              replacements: [roleRow.id, p.id],
            });
          } catch (e) { /* ignore dupes */ }
        }
        console.log('  Created inspection_team role with inspection permissions');
      }
    } else {
      console.log('  inspection_team role already exists');
    }

    console.log('Assigning all permissions to tenant_admin (users, roles, and all modules)...');
    const [tenantAdminRoles] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'tenant_admin'`);
    const [allPerms] = await db.sequelize.query(`SELECT id FROM permissions`);
    for (const role of tenantAdminRoles || []) {
      for (const perm of allPerms || []) {
        try {
          await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, {
            replacements: [role.id, perm.id],
          });
        } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned ${(allPerms || []).length} permissions to tenant_admin (role id ${role.id})`);
    }

    console.log('Adding created_by to contacts, companies, and leads...');
    try { await db.sequelize.query(`ALTER TABLE contacts ADD COLUMN created_by INT NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) console.warn(e.message); }
    try { await db.sequelize.query(`ALTER TABLE companies ADD COLUMN created_by INT NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) console.warn(e.message); }
    try { await db.sequelize.query(`ALTER TABLE leads ADD COLUMN created_by INT NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) console.warn(e.message); }

    const salesPermQuery = `
      SELECT id FROM permissions WHERE module IN ('leads','deals','contacts','companies','inspection_requests','inspection_reports')
      OR name LIKE 'leads.%' OR name LIKE 'deals.%' OR name LIKE 'contacts.%' OR name LIKE 'companies.%'
      OR name LIKE 'inspection_requests.%' OR name LIKE 'inspection_reports.%'
    `;

    console.log('Ensuring sales_manager role exists...');
    const [existingSalesManager] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'sales_manager' AND tenant_id IS NULL LIMIT 1`);
    if (!existingSalesManager || existingSalesManager.length === 0) {
      await db.sequelize.query(`
        INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
        VALUES (NULL, 'sales_manager', 'Sales Manager', 'Full access to leads, deals, contacts, quotations, inspection requests', 1, 'active', NOW(), NOW())
      `);
      console.log('  Created sales_manager role');
    } else {
      console.log('  sales_manager role already exists');
    }
    const [smRows] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'sales_manager' AND tenant_id IS NULL LIMIT 1`);
    if (smRows?.[0]?.id) {
      const [permRows] = await db.sequelize.query(salesPermQuery);
      for (const p of permRows || []) {
        try { await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [smRows[0].id, p.id] }); } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned ${(permRows || []).length} permissions to sales_manager`);
    }

    console.log('Ensuring sales role exists...');
    const [existingSales] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'sales' AND tenant_id IS NULL LIMIT 1`);
    if (!existingSales || existingSales.length === 0) {
      await db.sequelize.query(`
        INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
        VALUES (NULL, 'sales', 'Sales', 'Access to own leads, deals, contacts, quotations, and inspection requests only', 1, 'active', NOW(), NOW())
      `);
      console.log('  Created sales role');
    } else {
      console.log('  sales role already exists');
    }
    const [sRows] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'sales' AND tenant_id IS NULL LIMIT 1`);
    if (sRows?.[0]?.id) {
      const [permRows] = await db.sequelize.query(salesPermQuery);
      for (const p of permRows || []) {
        try { await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [sRows[0].id, p.id] }); } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned ${(permRows || []).length} permissions to sales`);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
