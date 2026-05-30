const db = require('./src/models');
const bcrypt = require('bcryptjs');

function isDuplicateSchemaError(e) {
  const m = e?.message || '';
  return (
    m.includes('Duplicate column') ||
    m.includes('Duplicate key') ||
    m.includes('Duplicate') ||
    m.includes('already exists')
  );
}

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
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN quantity_uom VARCHAR(50) NULL`);
    } catch (e) { if (!e.message?.includes('Duplicate')) throw e; }
    try {
      await db.sequelize.query(`ALTER TABLE deal_inspection_requests ADD COLUMN safety_tools TEXT NULL COMMENT 'JSON array of selected safety tool keys'`);
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

    console.log('Adding status to purchase_orders...');
    try {
      await db.sequelize.query(
        `ALTER TABLE purchase_orders ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'`
      );
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
      console.log('  status column already present');
    }
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD INDEX idx_po_status (status)`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
      console.log('  idx_po_status already present');
    }

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
    // Ensure inspection_team has users.read (for inspectors dropdown)
    const [inspRoleRows] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'inspection_team' AND tenant_id IS NULL LIMIT 1`);
    if (inspRoleRows?.[0]?.id) {
      const [usersReadPerm] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'users.read' LIMIT 1`);
      if (usersReadPerm?.[0]?.id) {
        try { await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [inspRoleRows[0].id, usersReadPerm[0].id] }); } catch (e) { /* ignore */ }
      }
    }

    console.log('Assigning all permissions to tenant_admin and admin roles...');
    const [adminRoles] = await db.sequelize.query(`SELECT id, name FROM roles WHERE name IN ('tenant_admin', 'admin')`);
    const [allPerms] = await db.sequelize.query(`SELECT id FROM permissions`);
    for (const role of adminRoles || []) {
      for (const perm of allPerms || []) {
        try {
          await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, {
            replacements: [role.id, perm.id],
          });
        } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned ${(allPerms || []).length} permissions to ${role.name} (role id ${role.id})`);
    }

    console.log('Adding supplier_id to contacts...');
    try { await db.sequelize.query(`ALTER TABLE contacts ADD COLUMN supplier_id INT NULL, ADD INDEX idx_supplier_id (supplier_id)`); } catch (e) { if (!e.message?.includes('Duplicate') && !e.message?.includes('Unknown column')) console.warn(e.message); }

    console.log('Adding downstream_partner_supplier_id to deals...');
    try { await db.sequelize.query(`ALTER TABLE deals ADD COLUMN downstream_partner_supplier_id INT NULL, ADD INDEX idx_downstream_partner_supplier (downstream_partner_supplier_id)`); } catch (e) { if (!e.message?.includes('Duplicate') && !e.message?.includes('Unknown column')) console.warn(e.message); }

    console.log('Adding company_id to purchase_orders, supplier_id nullable...');
    try { await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN company_id INT NULL, ADD INDEX idx_po_company (company_id)`); } catch (e) { if (!e.message?.includes('Duplicate') && !e.message?.includes('Unknown column')) console.warn(e.message); }
    try { await db.sequelize.query(`ALTER TABLE purchase_orders MODIFY supplier_id INT NULL`); } catch (e) { if (!e.message?.includes('Duplicate')) console.warn(e.message); }

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
      // Sales Manager needs users.read and suppliers.read
      const [extraPerms] = await db.sequelize.query(`SELECT id FROM permissions WHERE name IN ('users.read', 'suppliers.read')`);
      for (const p of extraPerms || []) {
        try { await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [smRows[0].id, p.id] }); } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned permissions to sales_manager`);
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
      // Sales needs users.read for dropdowns and suppliers.read for supplier list
      const [extraPerms] = await db.sequelize.query(`SELECT id FROM permissions WHERE name IN ('users.read', 'suppliers.read')`);
      for (const p of extraPerms || []) {
        try { await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [sRows[0].id, p.id] }); } catch (e) { /* ignore */ }
      }
      console.log(`  Assigned permissions to sales`);
    }

    console.log('Creating work_orders table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        deal_id INT NULL,
        title VARCHAR(255) NULL,
        notes TEXT NULL,
        status ENUM('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
        created_by INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        INDEX idx_work_orders_tenant (tenant_id),
        INDEX idx_work_orders_deal (deal_id),
        INDEX idx_work_orders_status (status)
      )
    `);

    console.log('Creating work_order_tasks table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_order_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        work_order_id INT NOT NULL,
        type_of_work VARCHAR(255) NULL,
        expense DECIMAL(15,2) NULL,
        estimated_duration VARCHAR(100) NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        assigned_to INT NULL,
        status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
        notes TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_work_order_tasks_wo (work_order_id),
        INDEX idx_work_order_tasks_assigned (assigned_to)
      )
    `);

    console.log('Creating work_types table and linking work_order_tasks...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_work_types_tenant_name (tenant_id, name),
        INDEX idx_work_types_tenant (tenant_id),
        CONSTRAINT fk_work_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    try {
      await db.sequelize.query('ALTER TABLE work_order_tasks ADD COLUMN work_type_id INT NULL');
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query('ALTER TABLE work_order_tasks ADD INDEX idx_work_order_tasks_work_type (work_type_id)');
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        ALTER TABLE work_order_tasks
        ADD CONSTRAINT fk_work_order_tasks_work_type FOREIGN KEY (work_type_id) REFERENCES work_types(id)
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    console.log('Dropping unique constraint uk_deal_terms from deal_terms (terms can be reused across deals)...');
    try {
      await db.sequelize.query(`ALTER TABLE deal_terms DROP INDEX uk_deal_terms`);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !e.message?.includes("Can't DROP") && !e.message?.includes('check that column/key exists')) throw e;
    }

    console.log('Adding company documentation columns (trade license, VAT cert, bank)...');
    const docCols = [
      'trade_license_file_path VARCHAR(500) NULL',
      'trade_license_number VARCHAR(100) NULL',
      'trade_license_name VARCHAR(255) NULL',
      'trade_license_expiry_date DATE NULL',
      'vat_certificate_file_path VARCHAR(500) NULL',
      'vat_certificate_trn VARCHAR(50) NULL',
      'bank_details_file_path VARCHAR(500) NULL',
      'bank_name VARCHAR(200) NULL',
      'bank_iban VARCHAR(50) NULL',
    ];
    for (const col of docCols) {
      try {
        await db.sequelize.query(`ALTER TABLE companies ADD COLUMN ${col}`);
      } catch (e) {
        if (!isDuplicateSchemaError(e)) throw e;
      }
      try {
        await db.sequelize.query(`ALTER TABLE suppliers ADD COLUMN ${col}`);
      } catch (e) {
        if (!isDuplicateSchemaError(e)) throw e;
      }
    }

    console.log('Updating deal statuses to new pipeline values...');
    // Must remap data before narrowing ENUM — convert to VARCHAR, map legacy values, then apply new ENUM.
    try {
      await db.sequelize.query(`
        ALTER TABLE deals MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'new'
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !e.message?.includes('Duplicate')) console.warn('  deal status → varchar:', e.message);
    }
    try {
      await db.sequelize.query(`
        UPDATE deals SET status = CASE LOWER(TRIM(status))
          WHEN 'draft' THEN 'new'
          WHEN 'pending' THEN 'negotiation'
          WHEN 'approved' THEN 'approved'
          WHEN 'in_progress' THEN 'negotiation'
          WHEN 'completed' THEN 'won'
          WHEN 'cancelled' THEN 'lost'
          ELSE status
        END
      `);
    } catch (e) { console.warn('  deal status remap:', e.message); }
    try {
      await db.sequelize.query(`
        UPDATE deals SET status = 'new'
        WHERE status NOT IN ('new','approved','quotation_sent','negotiation','won','lost')
      `);
    } catch (e) { console.warn('  deal status fallback:', e.message); }
    try {
      await db.sequelize.query(`
        ALTER TABLE deals
          MODIFY COLUMN status ENUM('new','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new'
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !e.message?.includes('already exists')) console.warn('  deal status enum final:', e.message);
    }
    try {
      await db.sequelize.query(`DELETE FROM deal_statuses`);
      await db.sequelize.query(`
        INSERT INTO deal_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
          ('new',            'New',             1, 1, NOW(), NOW()),
          ('approved',       'Approved',        2, 1, NOW(), NOW()),
          ('quotation_sent', 'Quotation Sent',  3, 1, NOW(), NOW()),
          ('negotiation',    'Negotiation',     4, 1, NOW(), NOW()),
          ('won',            'Won',             5, 1, NOW(), NOW()),
          ('lost',           'Lost',            6, 1, NOW(), NOW())
      `);
    } catch (e) { console.warn('  deal_statuses seed:', e.message); }

    console.log('Adding loss_reason to deals...');
    try {
      await db.sequelize.query(`ALTER TABLE deals ADD COLUMN loss_reason TEXT NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  loss_reason:', e.message); }

    console.log('Adding status to deal_inspection_requests...');
    try {
      await db.sequelize.query(`
        ALTER TABLE deal_inspection_requests
          ADD COLUMN status ENUM('request_submitted','team_assigned','inspection_completed','report_submitted') NOT NULL DEFAULT 'request_submitted'
      `);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  inspection status:', e.message); }

    console.log('Adding inspection_requests.update permission...');
    try {
      await db.sequelize.query(`
        INSERT IGNORE INTO permissions (name, display_name, module, action, description)
        VALUES ('inspection_requests.update', 'Update Inspection Requests', 'inspection_requests', 'update', 'Permission to update inspection requests')
      `);
    } catch (e) { console.warn('  inspection_requests.update perm:', e.message); }

    console.log('Updating quotation statuses...');
    try {
      await db.sequelize.query(`DELETE FROM quotation_statuses`);
      await db.sequelize.query(`
        INSERT INTO quotation_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
          ('new',          'New',          1, 1, NOW(), NOW()),
          ('sent',         'Sent',         2, 1, NOW(), NOW()),
          ('under_review', 'Under Review', 3, 1, NOW(), NOW()),
          ('revised',      'Revised',      4, 1, NOW(), NOW()),
          ('approved',     'Approved',     5, 1, NOW(), NOW()),
          ('rejected',     'Rejected',     6, 1, NOW(), NOW())
      `);
    } catch (e) { console.warn('  quotation_statuses seed:', e.message); }
    try {
      await db.sequelize.query(`UPDATE quotations SET status = 'new' WHERE status NOT IN ('new','sent','under_review','revised','approved','rejected')`);
    } catch (e) { console.warn('  quotation status update:', e.message); }

    console.log('Updating purchase order statuses...');
    try {
      await db.sequelize.query(`DELETE FROM purchase_order_statuses`);
      await db.sequelize.query(`
        INSERT INTO purchase_order_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
          ('new',          'New',          1, 1, NOW(), NOW()),
          ('sent',         'Sent',         2, 1, NOW(), NOW()),
          ('under_review', 'Under Review', 3, 1, NOW(), NOW()),
          ('revised',      'Revised',      4, 1, NOW(), NOW()),
          ('approved',     'Approved',     5, 1, NOW(), NOW()),
          ('rejected',     'Rejected',     6, 1, NOW(), NOW())
      `);
    } catch (e) { console.warn('  purchase_order_statuses seed:', e.message); }
    try {
      await db.sequelize.query(`UPDATE purchase_orders SET status = 'new' WHERE status NOT IN ('new','sent','under_review','revised','approved','rejected')`);
    } catch (e) { console.warn('  purchase_order status update:', e.message); }

    console.log('Adding work_types.is_default and work_order_task_expenses...');
    try {
      await db.sequelize.query('ALTER TABLE work_types ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0');
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS work_order_task_expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          work_order_task_id INT NOT NULL,
          description VARCHAR(255) NULL,
          amount DECIMAL(15,2) NOT NULL,
          sort_order INT DEFAULT 0,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_wote_task (work_order_task_id),
          CONSTRAINT fk_wote_task FOREIGN KEY (work_order_task_id) REFERENCES work_order_tasks(id) ON DELETE CASCADE
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }
    try {
      await db.sequelize.query(`
        INSERT INTO work_order_task_expenses (work_order_task_id, description, amount, sort_order, created_at, updated_at)
        SELECT wot.id, NULL, wot.expense, 0, NOW(), NOW()
        FROM work_order_tasks wot
        LEFT JOIN work_order_task_expenses e ON e.work_order_task_id = wot.id
        WHERE wot.expense IS NOT NULL AND CAST(wot.expense AS DECIMAL(15,2)) != 0 AND e.id IS NULL
      `);
    } catch (e) {
      console.warn('  backfill task expenses:', e.message);
    }

    console.log('Adding deal_items.unit_of_measure...');
    try {
      await db.sequelize.query('ALTER TABLE deal_items ADD COLUMN unit_of_measure VARCHAR(100) NULL');
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        UPDATE deal_items di
        INNER JOIN products_services ps ON ps.id = di.product_service_id
        SET di.unit_of_measure = ps.unit_of_measure
        WHERE (di.unit_of_measure IS NULL OR di.unit_of_measure = '')
          AND ps.unit_of_measure IS NOT NULL AND TRIM(ps.unit_of_measure) != ''
      `);
    } catch (e) {
      console.warn('  deal_items UOM backfill:', e.message);
    }

    console.log('Creating proforma_invoices tables...');
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS proforma_invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          quotation_id INT NOT NULL,
          deal_id INT NOT NULL,
          proforma_number VARCHAR(50) NOT NULL,
          invoice_date DATE NOT NULL,
          currency VARCHAR(10) DEFAULT 'AED',
          subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
          vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
          vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          total DECIMAL(15,2) NOT NULL DEFAULT 0,
          remarks TEXT NULL,
          created_by INT NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_pi_tenant (tenant_id),
          INDEX idx_pi_quotation (quotation_id),
          INDEX idx_pi_deal (deal_id),
          UNIQUE KEY uk_tenant_proforma_number (tenant_id, proforma_number),
          CONSTRAINT fk_pi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          CONSTRAINT fk_pi_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id),
          CONSTRAINT fk_pi_deal FOREIGN KEY (deal_id) REFERENCES deals(id),
          CONSTRAINT fk_pi_user FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS proforma_invoice_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          proforma_invoice_id INT NOT NULL,
          product_service_id INT NULL,
          description TEXT NULL,
          quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
          unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
          line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
          unit_of_measure VARCHAR(100) NULL,
          sort_order INT DEFAULT 0,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_pii_pi (proforma_invoice_id),
          CONSTRAINT fk_pii_pi FOREIGN KEY (proforma_invoice_id) REFERENCES proforma_invoices(id) ON DELETE CASCADE,
          CONSTRAINT fk_pii_ps FOREIGN KEY (product_service_id) REFERENCES products_services(id)
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }

    console.log('Adding proforma_invoices.due_date...');
    try {
      await db.sequelize.query(`ALTER TABLE proforma_invoices ADD COLUMN due_date DATE NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    console.log('Creating tax_invoices tables...');
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS tax_invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          proforma_invoice_id INT NOT NULL,
          tax_invoice_number VARCHAR(50) NOT NULL,
          invoice_date DATE NOT NULL,
          due_date DATE NULL,
          currency VARCHAR(10) DEFAULT 'AED',
          subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
          vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
          vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
          total DECIMAL(15,2) NOT NULL DEFAULT 0,
          payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
          payment_method VARCHAR(255) NULL,
          reference_no VARCHAR(255) NULL,
          attachment_path VARCHAR(500) NULL,
          remarks TEXT NULL,
          created_by INT NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_ti_tenant (tenant_id),
          UNIQUE KEY uk_ti_proforma (proforma_invoice_id),
          UNIQUE KEY uk_tenant_tax_number (tenant_id, tax_invoice_number),
          INDEX idx_ti_payment (payment_status),
          CONSTRAINT fk_ti_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          CONSTRAINT fk_ti_proforma FOREIGN KEY (proforma_invoice_id) REFERENCES proforma_invoices(id),
          CONSTRAINT fk_ti_user FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS tax_invoice_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tax_invoice_id INT NOT NULL,
          product_service_id INT NULL,
          description TEXT NULL,
          quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
          unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
          line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
          unit_of_measure VARCHAR(100) NULL,
          sort_order INT DEFAULT 0,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_tii_ti (tax_invoice_id),
          CONSTRAINT fk_tii_ti FOREIGN KEY (tax_invoice_id) REFERENCES tax_invoices(id) ON DELETE CASCADE,
          CONSTRAINT fk_tii_ps FOREIGN KEY (product_service_id) REFERENCES products_services(id)
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }

    console.log('Accounts: work_order_task_expenses approval columns + expenses ledger...');
    try {
      await db.sequelize.query(`
        ALTER TABLE work_order_task_expenses ADD COLUMN accounts_status VARCHAR(20) NOT NULL DEFAULT 'pending'
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE work_order_task_expenses ADD COLUMN accounts_approved_at DATETIME NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        ALTER TABLE work_order_task_expenses ADD COLUMN accounts_approved_by INT NULL,
        ADD CONSTRAINT fk_wote_accounts_user FOREIGN KEY (accounts_approved_by) REFERENCES users(id)
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          work_order_task_expense_id INT NOT NULL,
          category VARCHAR(100) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          expense_date DATE NOT NULL,
          paid_to VARCHAR(255) NULL,
          payment_method VARCHAR(255) NULL,
          notes TEXT NULL,
          reference VARCHAR(255) NULL,
          reference_id VARCHAR(255) NULL,
          created_by INT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_exp_tenant (tenant_id),
          INDEX idx_exp_date (expense_date),
          INDEX idx_exp_category (category),
          UNIQUE KEY uk_exp_task_line (work_order_task_expense_id),
          CONSTRAINT fk_exp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          CONSTRAINT fk_exp_wote FOREIGN KEY (work_order_task_expense_id) REFERENCES work_order_task_expenses(id),
          CONSTRAINT fk_exp_user FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e) && !String(e.message || '').includes('already exists')) throw e;
    }

    console.log('Expenses: nullable work_order_task_expense_id for manual ledger rows...');
    try {
      await db.sequelize.query(`ALTER TABLE expenses DROP FOREIGN KEY fk_exp_wote`);
    } catch (e) {
      if (!String(e.message || '').includes('Unknown') && !String(e.message || '').includes("doesn't exist")) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses DROP INDEX uk_exp_task_line`);
    } catch (e) {
      if (!String(e.message || '').includes('Unknown') && !String(e.message || '').includes("doesn't exist")) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses MODIFY work_order_task_expense_id INT NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`
        ALTER TABLE expenses ADD CONSTRAINT fk_exp_wote
        FOREIGN KEY (work_order_task_expense_id) REFERENCES work_order_task_expenses(id)
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses ADD UNIQUE KEY uk_exp_task_line (work_order_task_expense_id)`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    console.log('Normalizing reference codes to numeric primary keys (leads, deals, companies, suppliers, contacts)...');
    try {
      await db.sequelize.query(`UPDATE leads SET lead_number = CAST(id AS CHAR)`);
      await db.sequelize.query(`UPDATE deals SET deal_number = CAST(id AS CHAR) WHERE deleted_at IS NULL`);
      await db.sequelize.query(`UPDATE companies SET company_code = CAST(id AS CHAR) WHERE deleted_at IS NULL`);
      await db.sequelize.query(`UPDATE suppliers SET supplier_code = CAST(id AS CHAR) WHERE deleted_at IS NULL`);
      await db.sequelize.query(`UPDATE contacts SET contact_code = CAST(id AS CHAR) WHERE deleted_at IS NULL`);
      console.log('  Reference codes normalized to id');
    } catch (e) {
      console.warn('  Reference code normalization skipped:', e.message);
    }

    console.log('Adding paid_amount to tax_invoices...');
    try {
      await db.sequelize.query(`ALTER TABLE tax_invoices ADD COLUMN paid_amount DECIMAL(15,2) NULL DEFAULT NULL AFTER total`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    console.log('Adding is_rcm_applicable to deals...');
    try {
      await db.sequelize.query(`ALTER TABLE deals ADD COLUMN is_rcm_applicable TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Reverse Charge Mechanism: VAT paid to government by buyer, excluded from purchase documents'`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    console.log('ERP billing: expenses payment + purchase_orders payable columns...');
    try {
      await db.sequelize.query(
        `ALTER TABLE expenses ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'`
      );
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses ADD COLUMN paid_amount DECIMAL(15,2) NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses ADD COLUMN paid_at DATE NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE expenses ADD INDEX idx_exp_payment_status (payment_status)`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(
        `UPDATE expenses SET payment_status = 'paid', paid_amount = amount WHERE paid_amount IS NULL AND payment_status = 'unpaid'`
      );
    } catch (e) {
      console.warn('  expense payment backfill:', e.message);
    }

    try {
      await db.sequelize.query(
        `ALTER TABLE purchase_orders ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'`
      );
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN paid_amount DECIMAL(15,2) NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN due_date DATE NULL`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD INDEX idx_po_payment (payment_status)`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    // ── Operations Manager role ──────────────────────────────────────────────
    // Permissions: operations.* (work orders) + deals.read (view-only deals)
    console.log('Ensuring operations_manager role exists...');
    {
      const [[omRow]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'operations_manager' AND tenant_id IS NULL LIMIT 1`);
      if (!omRow?.id) {
        await db.sequelize.query(`
          INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
          VALUES (NULL, 'operations_manager', 'Operations Manager', 'Full access to Operations (work orders); view-only deals', 1, 'active', NOW(), NOW())
        `);
        const [[newOm]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'operations_manager' AND tenant_id IS NULL LIMIT 1`);
        if (newOm?.id) {
          const [opsPerms] = await db.sequelize.query(`SELECT id FROM permissions WHERE name LIKE 'operations.%'`);
          for (const p of opsPerms) {
            await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [newOm.id, p.id] });
          }
          const [[dealRead]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'deals.read' LIMIT 1`);
          if (dealRead?.id) {
            await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [newOm.id, dealRead.id] });
          }
          console.log('  Created operations_manager role');
        }
      } else {
        console.log('  operations_manager role already exists');
      }
    }

    // ── Accounts role ────────────────────────────────────────────────────────
    // Permissions: deals.read (view-only) + accounting.* for invoices/expenses/receivables/payables
    console.log('Ensuring accounts role exists...');
    {
      const [[acRow]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'accounts' AND tenant_id IS NULL LIMIT 1`);
      if (!acRow?.id) {
        await db.sequelize.query(`
          INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
          VALUES (NULL, 'accounts', 'Accounts', 'Full access to Accounts (invoices, receivables, payables, expenses); view-only deals', 1, 'active', NOW(), NOW())
        `);
        const [[newAc]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'accounts' AND tenant_id IS NULL LIMIT 1`);
        if (newAc?.id) {
          const [[dealRead]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'deals.read' LIMIT 1`);
          if (dealRead?.id) {
            await db.sequelize.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [newAc.id, dealRead.id] });
          }
          console.log('  Created accounts role');
        }
      } else {
        console.log('  accounts role already exists');
      }
    }

    // ── deal_items FK constraint (ON DELETE CASCADE) ─────────────────────────
    console.log('Ensuring deal_items FK constraint...');
    try {
      await db.sequelize.query(`
        ALTER TABLE deal_items
          ADD CONSTRAINT fk_deal_items_deal
          FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('  Added FK constraint on deal_items.deal_id');
    } catch (e) {
      if (isDuplicateSchemaError(e) || e.message?.includes('Duplicate key name') || e.message?.includes('fk_deal_items_deal')) {
        console.log('  FK constraint already exists');
      } else {
        throw e;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACCOUNTING MODULE — GL / JOURNAL / REPORTS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('Creating fiscal_years table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS fiscal_years (
        id         INT NOT NULL AUTO_INCREMENT,
        tenant_id  INT NOT NULL,
        name       VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date   DATE NOT NULL,
        status     VARCHAR(20) NOT NULL DEFAULT 'open',
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY idx_fy_tenant (tenant_id),
        CONSTRAINT fk_fy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating accounting_periods table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS accounting_periods (
        id             INT NOT NULL AUTO_INCREMENT,
        tenant_id      INT NOT NULL,
        fiscal_year_id INT NOT NULL,
        period_number  INT NOT NULL,
        name           VARCHAR(30) NOT NULL,
        start_date     DATE NOT NULL,
        end_date       DATE NOT NULL,
        status         VARCHAR(20) NOT NULL DEFAULT 'open',
        closed_by      INT DEFAULT NULL,
        closed_at      DATETIME DEFAULT NULL,
        created_at     DATETIME NOT NULL,
        updated_at     DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_ap_fy_period (tenant_id, fiscal_year_id, period_number),
        CONSTRAINT fk_ap_fy FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating chart_of_accounts table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id             INT NOT NULL AUTO_INCREMENT,
        tenant_id      INT NOT NULL,
        code           VARCHAR(20) NOT NULL,
        name           VARCHAR(150) NOT NULL,
        type           VARCHAR(20) NOT NULL,
        sub_type       VARCHAR(40) DEFAULT NULL,
        normal_balance VARCHAR(6) NOT NULL,
        is_group       TINYINT(1) NOT NULL DEFAULT 0,
        parent_id      INT DEFAULT NULL,
        is_system      TINYINT(1) NOT NULL DEFAULT 0,
        is_active      TINYINT(1) NOT NULL DEFAULT 1,
        description    TEXT DEFAULT NULL,
        sort_order     INT DEFAULT 0,
        created_at     DATETIME NOT NULL,
        updated_at     DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_coa_tenant_code (tenant_id, code),
        KEY idx_coa_tenant (tenant_id),
        KEY idx_coa_type (type),
        CONSTRAINT fk_coa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_coa_parent FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating journal_entries table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id             INT NOT NULL AUTO_INCREMENT,
        tenant_id      INT NOT NULL,
        entry_number   VARCHAR(30) NOT NULL,
        entry_date     DATE NOT NULL,
        description    VARCHAR(500) NOT NULL,
        source_type    VARCHAR(40) NOT NULL,
        source_id      INT DEFAULT NULL,
        status         VARCHAR(20) NOT NULL DEFAULT 'posted',
        auto_reverse   TINYINT(1) NOT NULL DEFAULT 0,
        reverse_date   DATE DEFAULT NULL,
        reversed_by_id INT DEFAULT NULL,
        voided_at      DATETIME DEFAULT NULL,
        voided_by      INT DEFAULT NULL,
        paid_to        VARCHAR(255) DEFAULT NULL,
        received_from  VARCHAR(255) DEFAULT NULL,
        created_by     INT NOT NULL,
        created_at     DATETIME NOT NULL,
        updated_at     DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_je_tenant_number (tenant_id, entry_number),
        KEY idx_je_entry_date (entry_date),
        KEY idx_je_source (source_type, source_id),
        KEY idx_je_status (status),
        CONSTRAINT fk_je_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_je_created_by FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating journal_entry_lines table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id               INT NOT NULL AUTO_INCREMENT,
        journal_entry_id INT NOT NULL,
        account_id       INT NOT NULL,
        debit            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        credit           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        description      VARCHAR(500) DEFAULT NULL,
        sort_order       INT DEFAULT 0,
        created_at       DATETIME NOT NULL,
        updated_at       DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY idx_jel_je (journal_entry_id),
        KEY idx_jel_account (account_id),
        CONSTRAINT fk_jel_je FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        CONSTRAINT fk_jel_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Adding journal entry counterparty columns...');
    for (const col of [
      ['paid_to', 'VARCHAR(255) NULL'],
      ['received_from', 'VARCHAR(255) NULL'],
    ]) {
      try {
        await db.sequelize.query(`ALTER TABLE journal_entries ADD COLUMN ${col[0]} ${col[1]}`);
        console.log(`  Added ${col[0]} to journal_entries`);
      } catch (e) {
        if (isDuplicateSchemaError(e)) console.log(`  ${col[0]} already present in journal_entries`);
        else throw e;
      }
    }

    console.log('Adding deleted_at (paranoid) to accounting tables...');
    for (const tbl of ['fiscal_years', 'accounting_periods', 'chart_of_accounts', 'journal_entries', 'journal_entry_lines']) {
      try {
        await db.sequelize.query(`ALTER TABLE \`${tbl}\` ADD COLUMN deleted_at DATETIME DEFAULT NULL`);
        console.log(`  Added deleted_at to ${tbl}`);
      } catch (e) {
        if (isDuplicateSchemaError(e)) console.log(`  deleted_at already present in ${tbl}`);
        else throw e;
      }
    }

    console.log('Assigning permissions to accounts role...');
    const [[accountsRole]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'accounts' LIMIT 1`);
    if (accountsRole) {
      // Permissions the accounts role needs — match by name prefix or exact name
      const namePrefixes = ['accounting.', 'reports.'];
      const exactNames = [
        'deals.read', 'leads.read', 'companies.read', 'suppliers.read',
        'contacts.read', 'dashboard.read',
      ];
      const prefixConditions = namePrefixes.map(() => 'name LIKE ?').join(' OR ');
      const exactConditions = exactNames.map(() => 'name = ?').join(' OR ');
      const [permRows] = await db.sequelize.query(
        `SELECT id FROM permissions WHERE (${prefixConditions}) OR (${exactConditions})`,
        { replacements: [...namePrefixes.map((p) => `${p}%`), ...exactNames] }
      );
      let added = 0;
      for (const perm of permRows) {
        try {
          await db.sequelize.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            { replacements: [accountsRole.id, perm.id] }
          );
          added++;
        } catch (e) { /* ignore duplicate */ }
      }
      console.log(`  Assigned ${added} permissions to accounts role`);
    } else {
      console.log('  accounts role not found — skipping');
    }

    console.log('ERP enhancements: inspection priority/accept-reject, expense evidence, notifications...');
    for (const col of [
      `ALTER TABLE deal_inspection_requests ADD COLUMN priority ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium'`,
      `ALTER TABLE deal_inspection_requests ADD COLUMN response_status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending'`,
      `ALTER TABLE deal_inspection_requests ADD COLUMN rejection_reason TEXT NULL`,
      `ALTER TABLE deal_inspection_requests ADD COLUMN responded_by INT NULL`,
      `ALTER TABLE deal_inspection_requests ADD COLUMN responded_at DATETIME NULL`,
      `ALTER TABLE work_order_task_expenses ADD COLUMN evidence_path VARCHAR(500) NULL`,
      `ALTER TABLE work_order_task_expenses ADD COLUMN evidence_file_name VARCHAR(255) NULL`,
      `ALTER TABLE work_order_task_expenses ADD COLUMN rejection_reason TEXT NULL`,
    ]) {
      try {
        await db.sequelize.query(col);
      } catch (e) {
        if (!isDuplicateSchemaError(e)) throw e;
      }
    }
    try {
      await db.sequelize.query(`
        ALTER TABLE deal_inspection_requests
        ADD CONSTRAINT fk_insp_responded_by FOREIGN KEY (responded_by) REFERENCES users(id)
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_notif_tenant_user_read (tenant_id, user_id, is_read),
        KEY idx_notif_tenant_user_created (tenant_id, user_id, created_at),
        CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Batch 3: purchase bill columns, permission fixes...');
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN work_order_id INT NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  work_order_id:', e.message); }
    try {
      await db.sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN document_type VARCHAR(20) NOT NULL DEFAULT 'quotation'`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  document_type:', e.message); }
    try {
      await db.sequelize.query(`
        ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      `);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  fk_po_work_order:', e.message); }

    try {
      await db.sequelize.query(`
        INSERT INTO permissions (name, display_name, module, action, description)
        VALUES ('leads.approve', 'Approve Leads', 'leads', 'approve', 'Permission to approve leads')
      `);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  leads.approve:', e.message); }

    const inspUpdateRoles = ['sales_manager', 'sales', 'inspection_team', 'operations_manager', 'admin', 'tenant_admin'];
    const [[inspUpdatePerm]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'inspection_requests.update' LIMIT 1`);
    if (inspUpdatePerm?.id) {
      for (const roleName of inspUpdateRoles) {
        const [[roleRow]] = await db.sequelize.query(
          `SELECT id FROM roles WHERE name = ? AND tenant_id IS NULL LIMIT 1`,
          { replacements: [roleName] }
        );
        if (roleRow?.id) {
          await db.sequelize.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            { replacements: [roleRow.id, inspUpdatePerm.id] }
          );
        }
      }
      console.log('  Backfilled inspection_requests.update to roles');
    }

    const [[leadsApprovePerm]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'leads.approve' LIMIT 1`);
    if (leadsApprovePerm?.id) {
      for (const roleName of ['sales_manager', 'admin', 'tenant_admin']) {
        const [[roleRow]] = await db.sequelize.query(
          `SELECT id FROM roles WHERE name = ? AND tenant_id IS NULL LIMIT 1`,
          { replacements: [roleName] }
        );
        if (roleRow?.id) {
          await db.sequelize.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            { replacements: [roleRow.id, leadsApprovePerm.id] }
          );
        }
      }
      console.log('  Backfilled leads.approve to sales_manager');
    }

    await db.sequelize.query(`
      DELETE rp FROM role_permissions rp
      INNER JOIN permissions p ON p.id = rp.permission_id
      INNER JOIN roles r ON r.id = rp.role_id
      WHERE r.name = 'accounts' AND p.name IN ('deals.create', 'deals.update', 'deals.delete', 'deals.approve')
    `);
    const [[dealsReadPerm]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'deals.read' LIMIT 1`);
    const [[accountsRoleRow]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'accounts' AND tenant_id IS NULL LIMIT 1`);
    if (accountsRoleRow?.id && dealsReadPerm?.id) {
      await db.sequelize.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        { replacements: [accountsRoleRow.id, dealsReadPerm.id] }
      );
    }
    console.log('  Accounts role: deals view-only enforced');

    await db.sequelize.query(`
      DELETE rp FROM role_permissions rp
      INNER JOIN permissions p ON p.id = rp.permission_id
      INNER JOIN roles r ON r.id = rp.role_id
      WHERE r.name = 'operations_manager' AND p.name IN ('deals.create', 'deals.update', 'deals.delete', 'deals.approve')
    `);
    const [[omRoleRow]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'operations_manager' AND tenant_id IS NULL LIMIT 1`);
    if (omRoleRow?.id) {
      const [opsPerms] = await db.sequelize.query(`SELECT id FROM permissions WHERE name LIKE 'operations.%'`);
      for (const p of opsPerms) {
        await db.sequelize.query(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          { replacements: [omRoleRow.id, p.id] }
        );
      }
      if (dealsReadPerm?.id) {
        await db.sequelize.query(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          { replacements: [omRoleRow.id, dealsReadPerm.id] }
        );
      }
      console.log('  Operations Manager role: operations.* + deals.read enforced');
    }

    console.log('Backfill inspection request status where report exists...');
    const [backfillResult] = await db.sequelize.query(`
      UPDATE deal_inspection_requests dir
      INNER JOIN deal_inspection_reports dr ON dr.deal_id = dir.deal_id
      SET dir.status = 'report_submitted'
      WHERE dir.status IS NULL OR dir.status != 'report_submitted'
    `);
    console.log(`  Updated ${backfillResult?.affectedRows ?? 0} inspection request(s)`);

    console.log('Creating payment_transactions table...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        source_type VARCHAR(20) NOT NULL COMMENT 'receivable|payable|expense',
        source_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(255) NULL,
        payment_account_id INT NULL,
        reference_no VARCHAR(255) NULL,
        paid_to VARCHAR(255) NULL,
        received_from VARCHAR(255) NULL,
        notes TEXT NULL,
        paid_at DATE NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_source (source_type, source_id),
        INDEX idx_paid_at (paid_at)
      )
    `);

    console.log('Creating GRN tables...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS grns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        grn_number VARCHAR(50) NOT NULL,
        work_order_id INT NULL,
        deal_id INT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        notes TEXT NULL,
        created_by INT NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_grn_tenant (tenant_id),
        INDEX idx_grn_number (grn_number),
        INDEX idx_grn_wo (work_order_id)
      )
    `);
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS grn_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grn_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        material_type_id INT NULL,
        quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
        unit_of_measure VARCHAR(20) DEFAULT 'kg',
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_grn_items_grn (grn_id)
      )
    `);
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS grn_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grn_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        original_name VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_grn_images_grn (grn_id)
      )
    `);

    console.log('Adding deal collection fields...');
    try {
      await db.sequelize.query(`ALTER TABLE deals ADD COLUMN pickup_location VARCHAR(500) NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  pickup_location:', e.message); }
    try {
      await db.sequelize.query(`ALTER TABLE deals ADD COLUMN pickup_contact_name VARCHAR(255) NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  pickup_contact_name:', e.message); }
    try {
      await db.sequelize.query(`ALTER TABLE deals ADD COLUMN pickup_contact_number VARCHAR(50) NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  pickup_contact_number:', e.message); }

    console.log('Seeding driver role...');
    await db.sequelize.query(`
      INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
      SELECT NULL, 'driver', 'Driver', 'Pickup and delivery driver', 1, 'active', NOW(), NOW()
      FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'driver' AND tenant_id IS NULL)
    `);
    const [[driverRole]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'driver' AND tenant_id IS NULL LIMIT 1`);
    if (driverRole?.id) {
      for (const permName of ['deals.read', 'operations.read']) {
        const [[perm]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = ? LIMIT 1`, { replacements: [permName] });
        if (perm?.id) {
          await db.sequelize.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            { replacements: [driverRole.id, perm.id] }
          );
        }
      }
      console.log('  Driver role seeded with deals.read + operations.read');
    }

    console.log('Backfill operations_manager users.read for task assignment...');
    const [[omRoleForUsers]] = await db.sequelize.query(`SELECT id FROM roles WHERE name = 'operations_manager' AND tenant_id IS NULL LIMIT 1`);
    const [[usersReadPermOm]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'users.read' LIMIT 1`);
    if (omRoleForUsers?.id && usersReadPermOm?.id) {
      await db.sequelize.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        { replacements: [omRoleForUsers.id, usersReadPermOm.id] }
      );
      console.log('  operations_manager granted users.read');
    }

    console.log('Seeding GRN permissions...');
    const grnPerms = [
      ['grn.read',   'Read GRN',   'grn', 'read',   'View goods received notes'],
      ['grn.create', 'Create GRN', 'grn', 'create', 'Create goods received notes'],
      ['grn.update', 'Update GRN', 'grn', 'update', 'Update / approve goods received notes'],
    ];
    for (const [name, displayName, mod, act, desc] of grnPerms) {
      try {
        await db.sequelize.query(
          `INSERT IGNORE INTO permissions (name, display_name, module, action, description) VALUES (?, ?, ?, ?, ?)`,
          { replacements: [name, displayName, mod, act, desc] }
        );
      } catch (e) { if (!isDuplicateSchemaError(e)) console.warn('  grn perm:', e.message); }
    }

    console.log('Assigning GRN permissions to operations_manager, admin, tenant_admin...');
    const grnPermRoles = ['operations_manager', 'admin', 'tenant_admin'];
    const [grnPermRows] = await db.sequelize.query(`SELECT id FROM permissions WHERE name LIKE 'grn.%'`);
    for (const roleName of grnPermRoles) {
      const [[roleRow]] = await db.sequelize.query(
        `SELECT id FROM roles WHERE name = ? AND tenant_id IS NULL LIMIT 1`,
        { replacements: [roleName] }
      );
      if (roleRow?.id) {
        for (const p of grnPermRows) {
          try {
            await db.sequelize.query(
              `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
              { replacements: [roleRow.id, p.id] }
            );
          } catch (e) { /* ignore */ }
        }
        console.log(`  Assigned grn.* to ${roleName}`);
      }
    }

    // grn.read for inspection_team and driver (read-only view)
    for (const roleName of ['inspection_team', 'driver', 'sales', 'sales_manager']) {
      const [[roleRow]] = await db.sequelize.query(
        `SELECT id FROM roles WHERE name = ? AND tenant_id IS NULL LIMIT 1`,
        { replacements: [roleName] }
      );
      const [[grnRead]] = await db.sequelize.query(`SELECT id FROM permissions WHERE name = 'grn.read' LIMIT 1`);
      if (roleRow?.id && grnRead?.id) {
        try {
          await db.sequelize.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            { replacements: [roleRow.id, grnRead.id] }
          );
        } catch (e) { /* ignore */ }
      }
    }
    console.log('  grn.read assigned to inspection_team, driver, sales, sales_manager');

    console.log('Ensuring all admin/tenant_admin roles have ALL permissions...');
    {
      const [adminRolesAll] = await db.sequelize.query(`SELECT id, name FROM roles WHERE name IN ('admin', 'tenant_admin')`);
      const [allPermsAll] = await db.sequelize.query(`SELECT id FROM permissions`);
      for (const role of adminRolesAll) {
        for (const perm of allPermsAll) {
          try {
            await db.sequelize.query(
              `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
              { replacements: [role.id, perm.id] }
            );
          } catch (e) { /* ignore */ }
        }
        console.log(`  Re-synced all ${allPermsAll.length} permissions to ${role.name}`);
      }
    }

    console.log('Adding sort_order to work_order_tasks for drag-and-drop reordering...');
    try {
      await db.sequelize.query(`ALTER TABLE work_order_tasks ADD COLUMN sort_order INT NOT NULL DEFAULT 0`);
      console.log('  Added sort_order column');
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
      console.log('  sort_order column already exists');
    }
    try {
      await db.sequelize.query(`UPDATE work_order_tasks SET sort_order = id WHERE sort_order = 0`);
      console.log('  Initialised sort_order from id for existing rows');
    } catch (e) {
      console.warn('  Could not initialise sort_order:', e.message);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
