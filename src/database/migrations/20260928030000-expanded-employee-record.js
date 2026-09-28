'use strict';

/**
 * Expanded Employee Record (HRM) — documentation copy only.
 *
 * IMPORTANT: this file is NOT what actually runs in deploys. The deploy
 * mechanism is run-migration.js at the repo root (a hand-maintained,
 * idempotent script), which is where these same changes were actually added
 * and actually executed/verified. This file exists purely so the schema
 * change is discoverable next to the other dated migration files; see
 * run-migration.js for the executed source of truth.
 */

function isDuplicateSchemaError(e) {
  const m = (e && e.message) || '';
  return (
    m.includes('Duplicate column') ||
    m.includes('Duplicate key') ||
    m.includes('Duplicate entry') ||
    m.includes('Duplicate') ||
    m.includes('already exists') ||
    m.includes("check that column/key exists") ||
    m.includes("Can't DROP")
  );
}

module.exports = {
  async up(queryInterface) {
    const q = (sql, opts) => queryInterface.sequelize.query(sql, opts);

    const employeeColumns = [
      ['profile_photo', 'VARCHAR(500) NULL'],
      ['middle_name', 'VARCHAR(100) NULL'],
      ['preferred_name', 'VARCHAR(100) NULL'],
      ['legal_full_name', 'VARCHAR(255) NULL'],
      ['marital_status', `ENUM('single','married','divorced','widowed') NULL`],
      ['religion', 'VARCHAR(50) NULL'],
      ['blood_group', 'VARCHAR(10) NULL'],
      ['personal_email', 'VARCHAR(150) NULL'],
      ['work_email', 'VARCHAR(150) NULL'],
      ['personal_phone', 'VARCHAR(20) NULL'],
      ['work_phone', 'VARCHAR(20) NULL'],
      ['current_address_line1', 'VARCHAR(255) NULL'],
      ['current_address_city', 'VARCHAR(100) NULL'],
      ['current_address_emirate', 'VARCHAR(100) NULL'],
      ['current_address_country', 'VARCHAR(100) NULL'],
      ['current_address_postal', 'VARCHAR(20) NULL'],
      ['permanent_address_line1', 'VARCHAR(255) NULL'],
      ['permanent_address_city', 'VARCHAR(100) NULL'],
      ['permanent_address_emirate', 'VARCHAR(100) NULL'],
      ['permanent_address_country', 'VARCHAR(100) NULL'],
      ['permanent_address_postal', 'VARCHAR(20) NULL'],
      ['work_location_id', 'INT NULL'],
      ['probation_start', 'DATE NULL'],
      ['probation_end', 'DATE NULL'],
      ['confirmation_date', 'DATE NULL'],
      ['labour_card_no', 'VARCHAR(50) NULL'],
      ['mol_person_id', 'VARCHAR(50) NULL'],
      ['wps_person_code', 'VARCHAR(50) NULL'],
      ['tax_id', 'VARCHAR(50) NULL'],
      ['payment_method_detail', 'VARCHAR(50) NULL'],
      ['routing_code', 'VARCHAR(50) NULL'],
      ['salary_visible_to_employee', 'TINYINT(1) NULL DEFAULT 1'],
    ];
    for (const [col, ddl] of employeeColumns) {
      try {
        await q(`ALTER TABLE employees ADD COLUMN ${col} ${ddl}`);
      } catch (e) {
        if (!isDuplicateSchemaError(e)) throw e;
      }
    }

    await q(`
      CREATE TABLE IF NOT EXISTS work_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        address VARCHAR(255) NULL,
        latitude DECIMAL(10,7) NULL,
        longitude DECIMAL(10,7) NULL,
        geofence_radius_meters INT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_wl_tenant (tenant_id)
      )
    `);

    try {
      await q(`ALTER TABLE employees ADD CONSTRAINT fk_employees_work_location FOREIGN KEY (work_location_id) REFERENCES work_locations(id)`);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) throw e;
    }

    const childTables = [
      `CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        name VARCHAR(150) NULL, relationship VARCHAR(50) NULL, phone VARCHAR(20) NULL, email VARCHAR(150) NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_eec_tenant (tenant_id), INDEX idx_eec_employee (employee_id),
        CONSTRAINT fk_eec_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS employee_dependents (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        name VARCHAR(150) NULL, relationship VARCHAR(50) NULL, date_of_birth DATE NULL, id_number VARCHAR(50) NULL, notes TEXT NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_ed_tenant (tenant_id), INDEX idx_ed_employee (employee_id),
        CONSTRAINT fk_ed_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS employee_qualifications (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        degree VARCHAR(150) NULL, institution VARCHAR(150) NULL, year INT NULL, grade VARCHAR(50) NULL, file_path VARCHAR(500) NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_eq_tenant (tenant_id), INDEX idx_eq_employee (employee_id),
        CONSTRAINT fk_eq_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS employee_skills (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        skill_name VARCHAR(100) NULL, proficiency_level ENUM('beginner','intermediate','advanced','expert') NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_es_tenant (tenant_id), INDEX idx_es_employee (employee_id),
        CONSTRAINT fk_es_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS employee_certifications (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        name VARCHAR(150) NULL, issuer VARCHAR(150) NULL, certificate_number VARCHAR(100) NULL,
        issue_date DATE NULL, expiry_date DATE NULL, file_path VARCHAR(500) NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_ec_tenant (tenant_id), INDEX idx_ec_employee (employee_id),
        CONSTRAINT fk_ec_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS employee_previous_employment (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        company_name VARCHAR(150) NULL, job_title VARCHAR(150) NULL, start_date DATE NULL, end_date DATE NULL, reason_for_leaving TEXT NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_epe_tenant (tenant_id), INDEX idx_epe_employee (employee_id),
        CONSTRAINT fk_epe_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS document_types (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NULL, name VARCHAR(100) NOT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX idx_dt_tenant (tenant_id))`,
      `CREATE TABLE IF NOT EXISTS employee_documents (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL, document_type_id INT NULL,
        document_number VARCHAR(100) NULL, issue_date DATE NULL, expiry_date DATE NULL, file_path VARCHAR(500) NULL, notes TEXT NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_edoc_tenant (tenant_id), INDEX idx_edoc_employee (employee_id),
        CONSTRAINT fk_edoc_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        CONSTRAINT fk_edoc_document_type FOREIGN KEY (document_type_id) REFERENCES document_types(id))`,
      `CREATE TABLE IF NOT EXISTS employee_notes (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        note_text TEXT NULL, created_by INT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_en_tenant (tenant_id), INDEX idx_en_employee (employee_id),
        CONSTRAINT fk_en_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        CONSTRAINT fk_en_created_by FOREIGN KEY (created_by) REFERENCES users(id))`,
      `CREATE TABLE IF NOT EXISTS employee_history (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL,
        event_type ENUM('joined','department_change','designation_change','manager_change','status_change','salary_change','promotion','transfer','other') NOT NULL,
        field_name VARCHAR(50) NULL, old_value VARCHAR(255) NULL, new_value VARCHAR(255) NULL, effective_date DATE NULL, reason TEXT NULL, recorded_by INT NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_eh_tenant (tenant_id), INDEX idx_eh_employee (employee_id),
        CONSTRAINT fk_eh_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        CONSTRAINT fk_eh_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id))`,
      `CREATE TABLE IF NOT EXISTS profile_change_requests (
        id INT AUTO_INCREMENT PRIMARY KEY, tenant_id INT NOT NULL, employee_id INT NOT NULL, field_group VARCHAR(50) NULL, changes JSON NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending', reviewed_by INT NULL, reviewed_at DATETIME NULL, rejection_reason VARCHAR(255) NULL,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
        INDEX idx_pcr_tenant (tenant_id), INDEX idx_pcr_employee (employee_id), INDEX idx_pcr_status (status),
        CONSTRAINT fk_pcr_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        CONSTRAINT fk_pcr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id))`,
    ];
    for (const ddl of childTables) {
      await q(ddl);
    }

    const attendanceColumns = [
      ['check_in_lat', 'DECIMAL(10,7) NULL'],
      ['check_in_lng', 'DECIMAL(10,7) NULL'],
      ['check_out_lat', 'DECIMAL(10,7) NULL'],
      ['check_out_lng', 'DECIMAL(10,7) NULL'],
      ['check_in_ip', 'VARCHAR(45) NULL'],
      ['check_out_ip', 'VARCHAR(45) NULL'],
    ];
    for (const [col, ddl] of attendanceColumns) {
      try {
        await q(`ALTER TABLE attendance_records ADD COLUMN ${col} ${ddl}`);
      } catch (e) {
        if (!isDuplicateSchemaError(e)) throw e;
      }
    }
  },

  async down() {
    // Not implemented — see run-migration.js note above; this file is documentation only.
  },
};
