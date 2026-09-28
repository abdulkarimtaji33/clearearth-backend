'use strict';

/**
 * HRM Module — creates all HR tables, extends designations, adds GL accounts,
 * extends permissions.module enum, and seeds HR permissions/roles/leave types.
 * Idempotent: this project's migration runner (src/database/migrate.js) re-runs
 * every migration file's `up()` on every invocation with no tracking table, so
 * every statement here must be safe to run repeatedly.
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
    // 1. departments
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NULL,
        parent_id INT NULL,
        head_employee_id INT NULL,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_departments_tenant_name (tenant_id, name),
        INDEX idx_departments_tenant (tenant_id),
        INDEX idx_departments_parent (parent_id),
        CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 2. designations extension
    // ---------------------------------------------------------------------
    try {
      await q(`ALTER TABLE designations ADD COLUMN department_id INT NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) throw e; }
    try {
      await q(`ALTER TABLE designations ADD COLUMN level INT NULL`);
    } catch (e) { if (!isDuplicateSchemaError(e)) throw e; }
    try {
      await q(`ALTER TABLE designations ADD CONSTRAINT fk_designations_department FOREIGN KEY (department_id) REFERENCES departments(id)`);
    } catch (e) { if (!isDuplicateSchemaError(e)) throw e; }

    // ---------------------------------------------------------------------
    // 3. employees
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT NULL,
        employee_code VARCHAR(30) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NULL,
        phone VARCHAR(20) NULL,
        department_id INT NULL,
        designation_id INT NULL,
        manager_id INT NULL,
        employment_type ENUM('full_time','part_time','contract','intern') NOT NULL DEFAULT 'full_time',
        date_of_joining DATE NOT NULL,
        date_of_exit DATE NULL,
        employment_status ENUM('onboarding','active','on_leave','suspended','exited') NOT NULL DEFAULT 'onboarding',
        gender ENUM('male','female','other') NULL,
        date_of_birth DATE NULL,
        nationality VARCHAR(60) NULL,
        national_id VARCHAR(60) NULL,
        passport_number VARCHAR(60) NULL,
        address TEXT NULL,
        emergency_contact_name VARCHAR(150) NULL,
        emergency_contact_phone VARCHAR(20) NULL,
        bank_name VARCHAR(100) NULL,
        bank_account_number VARCHAR(60) NULL,
        bank_iban VARCHAR(60) NULL,
        notes TEXT NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        UNIQUE KEY uk_employees_tenant_code (tenant_id, employee_code),
        INDEX idx_employees_tenant (tenant_id),
        INDEX idx_employees_department (department_id),
        INDEX idx_employees_designation (designation_id),
        INDEX idx_employees_manager (manager_id),
        INDEX idx_employees_user (user_id),
        INDEX idx_employees_status (employment_status),
        CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
        CONSTRAINT fk_employees_designation FOREIGN KEY (designation_id) REFERENCES designations(id),
        CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id) REFERENCES employees(id),
        CONSTRAINT fk_employees_created_by FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Follow-up FKs now that employees exists
    try {
      await q(`ALTER TABLE departments ADD CONSTRAINT fk_departments_head_employee FOREIGN KEY (head_employee_id) REFERENCES employees(id)`);
    } catch (e) { if (!isDuplicateSchemaError(e)) throw e; }
    try {
      await q(`ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id)`);
    } catch (e) { if (!isDuplicateSchemaError(e)) throw e; }

    // ---------------------------------------------------------------------
    // 4. employee_salary_structures
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS employee_salary_structures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        basic_salary DECIMAL(12,2) NOT NULL,
        housing_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        transport_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        other_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission_eligible TINYINT(1) NOT NULL DEFAULT 0,
        payment_method ENUM('bank_transfer','cash','cheque') NOT NULL DEFAULT 'bank_transfer',
        currency VARCHAR(3) NOT NULL DEFAULT 'AED',
        effective_from DATE NOT NULL,
        effective_to DATE NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_ess_tenant (tenant_id),
        INDEX idx_ess_employee (employee_id),
        INDEX idx_ess_active (is_active),
        CONSTRAINT fk_ess_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_ess_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_ess_created_by FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 5. attendance_records
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        check_in_time DATETIME NULL,
        check_out_time DATETIME NULL,
        check_in_source ENUM('self','hr_manual') NOT NULL DEFAULT 'self',
        check_out_source ENUM('self','hr_manual') NOT NULL DEFAULT 'self',
        status ENUM('present','absent','half_day','late','on_leave','holiday','weekend') NOT NULL DEFAULT 'present',
        work_hours DECIMAL(5,2) NULL,
        notes VARCHAR(255) NULL,
        entered_by INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_attendance_tenant_emp_date (tenant_id, employee_id, attendance_date),
        INDEX idx_attendance_tenant (tenant_id),
        INDEX idx_attendance_employee (employee_id),
        INDEX idx_attendance_date (attendance_date),
        CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_attendance_entered_by FOREIGN KEY (entered_by) REFERENCES users(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 6. attendance_regularization_requests
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS attendance_regularization_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        requested_check_in DATETIME NULL,
        requested_check_out DATETIME NULL,
        reason TEXT NOT NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        reviewed_by INT NULL,
        reviewed_at DATETIME NULL,
        review_notes VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_arr_tenant (tenant_id),
        INDEX idx_arr_employee (employee_id),
        INDEX idx_arr_status (status),
        CONSTRAINT fk_arr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_arr_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_arr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 7. leave_types
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20) NOT NULL,
        is_paid TINYINT(1) NOT NULL DEFAULT 1,
        default_annual_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        accrual_method ENUM('annual_lump_sum','monthly_accrual','none') NOT NULL DEFAULT 'annual_lump_sum',
        requires_approval TINYINT(1) NOT NULL DEFAULT 1,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_leave_types_tenant_code (tenant_id, code),
        INDEX idx_leave_types_tenant (tenant_id),
        CONSTRAINT fk_leave_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 8. leave_balances
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        year INT NOT NULL,
        entitled_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        accrued_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        used_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        carried_forward_days DECIMAL(6,2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_leave_balances (tenant_id, employee_id, leave_type_id, year),
        INDEX idx_leave_balances_tenant (tenant_id),
        INDEX idx_leave_balances_employee (employee_id),
        CONSTRAINT fk_leave_balances_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_leave_balances_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 9. leave_requests
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_count DECIMAL(5,2) NOT NULL,
        reason TEXT NULL,
        status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        approved_by INT NULL,
        approved_at DATETIME NULL,
        rejection_reason VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_leave_requests_tenant (tenant_id),
        INDEX idx_leave_requests_employee (employee_id),
        INDEX idx_leave_requests_status (status),
        CONSTRAINT fk_leave_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_leave_requests_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
        CONSTRAINT fk_leave_requests_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 10. holidays
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        holiday_date DATE NOT NULL,
        is_recurring TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_holidays_tenant_date (tenant_id, holiday_date),
        INDEX idx_holidays_tenant (tenant_id),
        CONSTRAINT fk_holidays_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 11. payroll_runs
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        period_month TINYINT NOT NULL,
        period_year SMALLINT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        status ENUM('draft','processed','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
        total_gross DECIMAL(14,2) NOT NULL DEFAULT 0,
        total_deductions DECIMAL(14,2) NOT NULL DEFAULT 0,
        total_net DECIMAL(14,2) NOT NULL DEFAULT 0,
        processed_by INT NULL,
        processed_at DATETIME NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        paid_at DATETIME NULL,
        notes VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_payroll_runs_period (tenant_id, period_year, period_month),
        INDEX idx_payroll_runs_tenant (tenant_id),
        CONSTRAINT fk_payroll_runs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_payroll_runs_processed_by FOREIGN KEY (processed_by) REFERENCES users(id),
        CONSTRAINT fk_payroll_runs_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // ---------------------------------------------------------------------
    // 12. payslips
    // ---------------------------------------------------------------------
    await q(`
      CREATE TABLE IF NOT EXISTS payslips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        payroll_run_id INT NOT NULL,
        employee_id INT NOT NULL,
        basic_salary DECIMAL(12,2) NOT NULL,
        housing_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        transport_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        other_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        gross_salary DECIMAL(12,2) NOT NULL,
        days_in_month SMALLINT NOT NULL,
        paid_days DECIMAL(5,2) NOT NULL,
        unpaid_leave_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        absent_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        proration_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
        other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
        net_salary DECIMAL(12,2) NOT NULL,
        payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
        paid_at DATETIME NULL,
        payment_method ENUM('bank_transfer','cash','cheque') NULL,
        journal_entry_id_accrual INT NULL,
        journal_entry_id_payment INT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_payslips_run_employee (tenant_id, payroll_run_id, employee_id),
        INDEX idx_payslips_tenant (tenant_id),
        INDEX idx_payslips_employee (employee_id),
        CONSTRAINT fk_payslips_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        CONSTRAINT fk_payslips_run FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
        CONSTRAINT fk_payslips_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    // ---------------------------------------------------------------------
    // A. Chart of accounts additions (idempotent per tenant)
    // ---------------------------------------------------------------------
    const NEW_ACCOUNTS = [
      { code: '2400', name: 'Salaries Payable',                type: 'liability', sub_type: 'current_liability',   normal_balance: 'credit', sort_order: 145 },
      { code: '2410', name: 'Commission Payable',               type: 'liability', sub_type: 'current_liability',   normal_balance: 'credit', sort_order: 146 },
      { code: '5700', name: 'Salaries & Wages Expense',         type: 'expense',   sub_type: 'operating_expense',   normal_balance: 'debit',  sort_order: 480 },
      { code: '5710', name: 'Staff Commission Expense',         type: 'expense',   sub_type: 'operating_expense',   normal_balance: 'debit',  sort_order: 490 },
      { code: '5720', name: 'Employee Benefits & Allowances',   type: 'expense',   sub_type: 'operating_expense',   normal_balance: 'debit',  sort_order: 500 },
    ];
    const [tenantRows] = await q(`SELECT id FROM tenants`);
    for (const tenant of tenantRows || []) {
      const [existingCoa] = await q(`SELECT code FROM chart_of_accounts WHERE tenant_id = ?`, { replacements: [tenant.id] });
      const existingCodes = new Set((existingCoa || []).map((r) => r.code));
      for (const a of NEW_ACCOUNTS) {
        if (existingCodes.has(a.code)) continue;
        await q(
          `INSERT INTO chart_of_accounts (tenant_id, code, name, type, sub_type, normal_balance, is_group, is_system, is_active, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NOW(), NOW())`,
          { replacements: [tenant.id, a.code, a.name, a.type, a.sub_type, a.normal_balance, a.sort_order] }
        );
      }
    }

    // ---------------------------------------------------------------------
    // C. Permissions & roles
    // ---------------------------------------------------------------------
    try {
      await q(`
        ALTER TABLE permissions MODIFY COLUMN module ENUM(
          'users','roles','contacts','companies','suppliers','leads','products','deals',
          'inspection_requests','inspection_reports','quotations','purchase_orders',
          'accounting','reports','operations','grn','hr'
        ) NOT NULL
      `);
    } catch (e) {
      if (!isDuplicateSchemaError(e)) console.warn('  permissions.module enum alter:', e.message);
    }

    const HR_PERMISSIONS = [
      ['hr.employees.manage', 'Manage HR Employees', 'employees'],
      ['hr.employees.read', 'Read HR Employees', 'employees'],
      ['hr.attendance.manage', 'Manage HR Attendance', 'attendance'],
      ['hr.attendance.read', 'Read HR Attendance', 'attendance'],
      ['hr.leave.approve', 'Approve HR Leave', 'leave'],
      ['hr.leave.read', 'Read HR Leave', 'leave'],
      ['hr.payroll.process', 'Process HR Payroll', 'payroll'],
      ['hr.payroll.read', 'Read HR Payroll', 'payroll'],
      ['hr.settings.manage', 'Manage HR Settings', 'settings'],
    ];
    for (const [name, displayName, action] of HR_PERMISSIONS) {
      try {
        await q(
          `INSERT IGNORE INTO permissions (name, display_name, module, action, description) VALUES (?, ?, 'hr', 'update', ?)`,
          { replacements: [name, displayName, `Permission: ${name}`] }
        );
      } catch (e) {
        if (!isDuplicateSchemaError(e)) console.warn('  hr permission insert:', e.message);
      }
    }

    // hr_manager role — system-wide like sales_manager/operations_manager (tenant_id NULL)
    const [existingHrManager] = await q(`SELECT id FROM roles WHERE name = 'hr_manager' AND tenant_id IS NULL LIMIT 1`);
    if (!existingHrManager || existingHrManager.length === 0) {
      await q(`
        INSERT INTO roles (tenant_id, name, display_name, description, is_system_role, status, created_at, updated_at)
        VALUES (NULL, 'hr_manager', 'HR Manager', 'Full access to employees, attendance, leave and payroll', 1, 'active', NOW(), NOW())
      `);
    }
    const [hrManagerRows] = await q(`SELECT id FROM roles WHERE name = 'hr_manager' AND tenant_id IS NULL LIMIT 1`);
    const [hrPermRows] = await q(`SELECT id FROM permissions WHERE name LIKE 'hr.%'`);

    async function grantPermsToRole(roleId, permIds) {
      for (const p of permIds) {
        try {
          await q(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, { replacements: [roleId, p] });
        } catch (e) { /* ignore dupes */ }
      }
    }

    if (hrManagerRows?.[0]?.id) {
      await grantPermsToRole(hrManagerRows[0].id, (hrPermRows || []).map((p) => p.id));
    }

    // Grant all hr.* to admin/tenant_admin/super_admin roles
    const [adminRoles] = await q(`SELECT id, name FROM roles WHERE name IN ('tenant_admin', 'admin', 'super_admin')`);
    for (const role of adminRoles || []) {
      await grantPermsToRole(role.id, (hrPermRows || []).map((p) => p.id));
    }

    // Grant hr.leave.approve + hr.attendance.read to sales_manager / operations_manager (app-level manager scoping applies)
    const [scopedRoles] = await q(`SELECT id, name FROM roles WHERE name IN ('sales_manager', 'operations_manager')`);
    const [scopedPerms] = await q(`SELECT id FROM permissions WHERE name IN ('hr.leave.approve', 'hr.attendance.read')`);
    for (const role of scopedRoles || []) {
      await grantPermsToRole(role.id, (scopedPerms || []).map((p) => p.id));
    }

    // Grant hr.payroll.read to accounts role
    const [accountsRoleRows] = await q(`SELECT id FROM roles WHERE name = 'accounts'`);
    const [payrollReadPerm] = await q(`SELECT id FROM permissions WHERE name = 'hr.payroll.read'`);
    for (const role of accountsRoleRows || []) {
      await grantPermsToRole(role.id, (payrollReadPerm || []).map((p) => p.id));
    }

    // ---------------------------------------------------------------------
    // Seed default leave types per tenant
    // ---------------------------------------------------------------------
    const DEFAULT_LEAVE_TYPES = [
      ['Annual Leave', 'ANNUAL', 1, 30],
      ['Sick Leave', 'SICK', 1, 15],
      ['Casual Leave', 'CASUAL', 1, 7],
      ['Unpaid Leave', 'UNPAID', 0, 0],
    ];
    for (const tenant of tenantRows || []) {
      const [existingTypes] = await q(`SELECT code FROM leave_types WHERE tenant_id = ?`, { replacements: [tenant.id] });
      const existingCodes = new Set((existingTypes || []).map((r) => r.code));
      for (const [name, code, isPaid, days] of DEFAULT_LEAVE_TYPES) {
        if (existingCodes.has(code)) continue;
        const requiresApproval = 1;
        await q(
          `INSERT INTO leave_types (tenant_id, name, code, is_paid, default_annual_days, accrual_method, requires_approval, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'annual_lump_sum', ?, 1, NOW(), NOW())`,
          { replacements: [tenant.id, name, code, isPaid, days, requiresApproval] }
        );
      }
    }

    // ---------------------------------------------------------------------
    // Seed fixed-date UAE public holidays per tenant (current + next year).
    // Islamic-calendar holidays (Eid al-Fitr, Eid al-Adha, Islamic New Year,
    // Prophet's Birthday) shift every year and require an authoritative lookup
    // for the correct Gregorian dates — not guessed here. HR should add those
    // manually via the Holiday Calendar UI.
    // ---------------------------------------------------------------------
    const holidayCurrentYear = new Date().getFullYear();
    const fixedHolidaysFor = (year) => ([
      [`${year}-01-01`, "New Year's Day"],
      [`${year}-12-01`, 'Commemoration Day'],
      [`${year}-12-02`, 'UAE National Day'],
      [`${year}-12-03`, 'UAE National Day (Day 2)'],
    ]);
    for (const tenant of tenantRows || []) {
      for (const year of [holidayCurrentYear, holidayCurrentYear + 1]) {
        for (const [holidayDate, name] of fixedHolidaysFor(year)) {
          try {
            await q(
              `INSERT IGNORE INTO holidays (tenant_id, name, holiday_date, is_recurring, created_at, updated_at)
               VALUES (?, ?, ?, 1, NOW(), NOW())`,
              { replacements: [tenant.id, name, holidayDate] }
            );
          } catch (e) {
            if (!isDuplicateSchemaError(e)) throw e;
          }
        }
      }
    }
  },

  async down() {
    // Intentionally no-op: this migration file is re-run on every deploy by
    // the project's tracking-less migration runner; a destructive down() is
    // not exercised by that flow and would be unsafe to run automatically.
  },
};
