'use strict';

/**
 * Phase 2 — Sales Commission module + Inspection Request Google Maps location sharing.
 * Idempotent: this project's migration runner (src/database/migrate.js) re-runs every
 * migration file's `up()` on every invocation with no tracking table, so every
 * statement here must be safe to run repeatedly.
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

    // ---------------------------------------------------------------------
    // 1. commission_settings
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS commission_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT NOT NULL,
        commission_percentage DECIMAL(5,2) NOT NULL,
        effective_from DATE NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_cs_tenant (tenant_id),
        INDEX idx_cs_user (user_id),
        INDEX idx_cs_active (is_active),
        CONSTRAINT fk_commission_settings_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_commission_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `).catch((e) => { if (!isDuplicateSchemaError(e)) throw e; });

    // ---------------------------------------------------------------------
    // 2. commissions
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT NOT NULL,
        quotation_id INT NOT NULL,
        deal_id INT NULL,
        quotation_amount DECIMAL(15,2) NOT NULL,
        commission_percentage DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(15,2) NOT NULL,
        status ENUM('accrued','paid','in_payroll') NOT NULL DEFAULT 'accrued',
        payslip_id INT NULL,
        journal_entry_id INT NULL,
        paid_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uq_commission_tenant_quotation (tenant_id, quotation_id),
        INDEX idx_comm_tenant (tenant_id),
        INDEX idx_comm_user (user_id),
        INDEX idx_comm_status (status),
        CONSTRAINT fk_commissions_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_commissions_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id)
      )
    `).catch((e) => { if (!isDuplicateSchemaError(e)) throw e; });

    // ---------------------------------------------------------------------
    // 3. deal_inspection_location_tokens
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS deal_inspection_location_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        inspection_request_id INT NOT NULL,
        tenant_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_dilt_request (inspection_request_id),
        INDEX idx_dilt_tenant (tenant_id),
        CONSTRAINT fk_dilt_inspection_request FOREIGN KEY (inspection_request_id) REFERENCES deal_inspection_requests(id) ON DELETE CASCADE
      )
    `).catch((e) => { if (!isDuplicateSchemaError(e)) throw e; });

    // ---------------------------------------------------------------------
    // 4. Chart of accounts — 2410 Commission Payable / 5710 Staff Commission Expense
    //    Backfill for tenants that already ran the account seeder before this
    //    code existed. Check-before-insert; the concurrent HRM module may have
    //    already created these exact codes (2410/5710 overlap with its scope),
    //    in which case we just reuse the existing rows.
    // ---------------------------------------------------------------------
    const [tenants] = await q(`SELECT id FROM tenants`);
    for (const t of tenants || []) {
      const [existing] = await q(
        `SELECT code FROM chart_of_accounts WHERE tenant_id = ? AND code IN ('2410','5710')`,
        { replacements: [t.id] }
      );
      const existingCodes = new Set((existing || []).map((r) => r.code));
      const now = new Date();
      const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

      if (!existingCodes.has('2410')) {
        await q(
          `INSERT INTO chart_of_accounts (tenant_id, code, name, type, sub_type, normal_balance, is_group, is_system, is_active, sort_order, created_at, updated_at)
           VALUES (?, '2410', 'Commission Payable', 'liability', 'current_liability', 'credit', 0, 1, 1, 145, ?, ?)`,
          { replacements: [t.id, fmt(now), fmt(now)] }
        ).catch((e) => { if (!isDuplicateSchemaError(e)) throw e; });
      }
      if (!existingCodes.has('5710')) {
        await q(
          `INSERT INTO chart_of_accounts (tenant_id, code, name, type, sub_type, normal_balance, is_group, is_system, is_active, sort_order, created_at, updated_at)
           VALUES (?, '5710', 'Staff Commission Expense', 'expense', 'operating_expense', 'debit', 0, 1, 1, 475, ?, ?)`,
          { replacements: [t.id, fmt(now), fmt(now)] }
        ).catch((e) => { if (!isDuplicateSchemaError(e)) throw e; });
      }
    }

    console.log('✅ Phase 2 migration (commissions + inspection location share) completed');
  },
};
