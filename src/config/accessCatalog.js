/**
 * Access Catalog — single source of truth for every permission, data-scope
 * module and field-visibility group in the system.
 *
 * - Permissions are synced to the `permissions` table at startup / migration
 *   (see src/database/accessControl.setup.js), so adding a permission here is
 *   all that is needed for it to appear in the Roles UI.
 * - `legacy` describes how a *newly created* permission is granted to roles
 *   that already exist, so introducing it never changes behaviour for current
 *   users. Admins can then edit freely from the UI.
 *
 *   legacy: { roles: [...] }     -> grant to roles with these names
 *           { allExcept: [...] } -> grant to every role except these names
 *           { inherit: [...] }   -> grant to roles already holding any of these permissions
 *           { all: true }        -> grant to every role
 */

const ADMIN_ROLES = ['admin', 'tenant_admin'];

/** Modules shown in the permission matrix (order = display order). */
const MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Which dashboard a user sees on login' },
  { key: 'contacts', label: 'Contacts', description: 'People at clients and vendors' },
  { key: 'companies', label: 'Clients', description: 'Client companies' },
  { key: 'suppliers', label: 'Vendors', description: 'Vendor / supplier companies' },
  { key: 'leads', label: 'Leads', description: 'Sales leads and qualification' },
  { key: 'deals', label: 'Deals', description: 'Deals pipeline' },
  { key: 'quotations', label: 'Quotations & Orders', description: 'Service quotations and orders' },
  { key: 'purchase_orders', label: 'Purchase Orders', description: 'Client and vendor purchase quotations / orders' },
  { key: 'products', label: 'Products & Services', description: 'Product and service catalog' },
  { key: 'inspection_requests', label: 'Inspection Requests', description: 'Request and schedule inspections' },
  { key: 'inspection_reports', label: 'Inspection Reports', description: 'Record and approve inspection reports' },
  { key: 'operations', label: 'Operations (Work Orders)', description: 'Work orders, tasks and field operations' },
  { key: 'grn', label: 'GRN & Inventory', description: 'Goods received notes and stock' },
  { key: 'outbound', label: 'Outbound', description: 'Outbound entries, gatepasses and delivery scheduling' },
  { key: 'certificates', label: 'Certificates', description: 'Recycling / disposal certificates and carbon footprint' },
  { key: 'accounting', label: 'Accounting', description: 'Invoices, payments, expenses, ledger and bank' },
  { key: 'invoices', label: 'Invoicing Rules', description: 'Who may issue invoices' },
  { key: 'reports', label: 'Financial Reports', description: 'Trial balance, P&L, balance sheet, VAT and more' },
  { key: 'commissions', label: 'Sales Commissions', description: 'Commission rates and statements' },
  { key: 'hr', label: 'HR', description: 'Employees, attendance, leave and payroll' },
  { key: 'workflow', label: 'Approvals & Workflow', description: 'Manager authority across the system' },
  { key: 'driver', label: 'Driver App', description: 'Mobile driver app access' },
  { key: 'users', label: 'Users', description: 'User accounts' },
  { key: 'roles', label: 'Roles & Access', description: 'Roles, permissions and per-user overrides' },
  { key: 'settings', label: 'Company Settings', description: 'Tenant settings and master data' },
];

/**
 * Permission definitions.
 * name   -> 'module.action' or 'module.category.action'
 * danger -> highlighted in the UI (money movement, deletion, privilege changes)
 */
const P = (name, label, description, opts = {}) => {
  const parts = name.split('.');
  return {
    name,
    module: parts[0],
    category: parts.length > 2 ? parts[1] : null,
    action: parts[parts.length - 1],
    label,
    description,
    danger: Boolean(opts.danger),
    legacy: opts.legacy || null,
  };
};

const PERMISSIONS = [
  // ── Dashboard variants ───────────────────────────────────────────────
  P('dashboard.view_super_admin', 'Platform dashboard', 'Cross-tenant platform overview', { legacy: { roles: ['super_admin'] } }),
  P('dashboard.view_admin', 'Admin dashboard', 'Company-wide KPIs, revenue, receivables and activity', { legacy: { roles: ADMIN_ROLES } }),
  P('dashboard.view_operations', 'Operations dashboard', 'Work orders, tasks and field activity', { legacy: { roles: ['operations_manager'] } }),
  P('dashboard.view_accounts', 'Accounts dashboard', 'Receivables, payables and expenses', { legacy: { roles: ['accounts'] } }),
  P('dashboard.view_sales_manager', 'Sales manager dashboard', 'Team pipeline and approvals', { legacy: { roles: ['sales_manager'] } }),
  P('dashboard.view_inspection', 'Inspection dashboard', 'Assigned inspections', { legacy: { roles: ['inspection_team'] } }),
  P('dashboard.view_driver', 'Driver dashboard', 'Assigned pickups', { legacy: { roles: ['driver'] } }),
  P('dashboard.view_sales', 'Sales dashboard', 'Own leads, deals and targets', { legacy: { roles: ['sales', 'sales_executive'] } }),

  // ── CRM ──────────────────────────────────────────────────────────────
  P('contacts.read', 'View contacts', 'See contacts'),
  P('contacts.create', 'Create contacts', 'Add new contacts'),
  P('contacts.update', 'Edit contacts', 'Edit existing contacts'),
  P('contacts.delete', 'Delete contacts', 'Permanently remove contacts', { danger: true }),
  P('companies.read', 'View clients', 'See client companies'),
  P('companies.create', 'Create clients', 'Add client companies'),
  P('companies.update', 'Edit clients', 'Edit client companies'),
  P('companies.delete', 'Delete clients', 'Permanently remove client companies', { danger: true }),
  P('suppliers.read', 'View vendors', 'See vendors'),
  P('suppliers.create', 'Create vendors', 'Add vendors'),
  P('suppliers.update', 'Edit vendors', 'Edit vendors'),
  P('suppliers.delete', 'Delete vendors', 'Permanently remove vendors', { danger: true }),
  P('leads.read', 'View leads', 'See leads'),
  P('leads.create', 'Create leads', 'Add leads'),
  P('leads.update', 'Edit leads', 'Edit leads'),
  P('leads.delete', 'Delete leads', 'Permanently remove leads', { danger: true }),
  P('leads.approve', 'Approve leads', 'Qualify and approve leads', { legacy: { inherit: ['leads.approve'] } }),
  P('deals.read', 'View deals', 'See deals and related documents'),
  P('deals.create', 'Create deals', 'Add deals'),
  P('deals.update', 'Edit deals', 'Edit deals'),
  P('deals.delete', 'Delete deals', 'Permanently remove deals', { danger: true }),
  P('deals.approve', 'Approve deals', 'Approve deals / pipeline gates'),
  P('quotations.read', 'View quotations & orders', 'See service quotations and orders'),
  P('quotations.update', 'Edit quotations & orders', 'Create and edit service quotations and orders'),
  P('quotations.approve', 'Approve quotations', 'Approve service quotations'),
  P('purchase_orders.read', 'View purchase orders', 'See client / vendor purchase quotations and orders'),
  P('purchase_orders.update', 'Edit purchase orders', 'Create and edit purchase quotations and orders'),
  P('purchase_orders.approve', 'Approve purchase orders', 'Approve purchase quotations and orders'),
  P('products.read', 'View products & services', 'See the catalog', { legacy: { all: true } }),
  P('products.create', 'Create products & services', 'Add catalog items', { legacy: { inherit: ['deals.update'], roles: ADMIN_ROLES } }),
  P('products.update', 'Edit products & services', 'Edit catalog items', { legacy: { inherit: ['deals.update'], roles: ADMIN_ROLES } }),
  P('products.delete', 'Delete products & services', 'Remove catalog items', { danger: true, legacy: { roles: ADMIN_ROLES } }),

  // ── Inspections ──────────────────────────────────────────────────────
  P('inspection_requests.read', 'View inspection requests', 'See inspection requests'),
  P('inspection_requests.update', 'Manage inspection requests', 'Create, assign and update inspection requests'),
  P('inspection_reports.read', 'View inspection reports', 'See inspection reports'),
  P('inspection_reports.create', 'Create inspection reports', 'Record inspection reports'),
  P('inspection_reports.update', 'Edit inspection reports', 'Edit inspection reports'),
  P('inspection_reports.approve', 'Approve inspection reports', 'Approve a report as the reviewing authority', {
    legacy: { roles: ['sales', 'sales_manager', 'operations_manager', ...ADMIN_ROLES] },
  }),
  P('inspection_reports.perform', 'Act as inspector', 'Reports are recorded under the user’s own name (field inspectors)', {
    legacy: { roles: ['inspection_team', 'inspection'] },
  }),

  // ── Operations ───────────────────────────────────────────────────────
  P('operations.read', 'View work orders', 'See work orders and tasks'),
  P('operations.create', 'Create work orders', 'Create work orders'),
  P('operations.update', 'Edit work orders', 'Edit work orders, assign tasks and drivers'),
  P('operations.delete', 'Delete work orders', 'Permanently remove work orders', { danger: true }),
  P('grn.read', 'View GRN & inventory', 'See goods received notes and stock'),
  P('grn.create', 'Create GRN', 'Record goods received'),
  P('grn.update', 'Edit GRN', 'Edit goods received notes'),
  P('outbound.read', 'View outbound', 'See outbound entries, gatepasses and the registers', { legacy: { inherit: ['grn.read'] } }),
  P('outbound.update', 'Edit outbound', 'Set the outbound type, items and gatepass details', { legacy: { inherit: ['grn.update'] } }),
  P('outbound.schedule', 'Request delivery date', 'Request a delivery date from operations, confirm or reschedule it', { legacy: { inherit: ['grn.update', 'quotations.update', 'purchase_orders.update'] } }),
  P('certificates.read', 'View certificates', 'See certificate requests and register'),
  P('certificates.create', 'Create certificates', 'Create certificate requests'),
  P('certificates.update', 'Edit certificates', 'Edit certificate requests'),
  P('certificates.verify', 'Verify / issue certificates', 'Verify and issue certificates'),
  P('certificates.manage', 'Manage carbon factors', 'Maintain carbon footprint factors and settings'),

  // ── Accounting ───────────────────────────────────────────────────────
  P('accounting.read', 'View accounts', 'See invoices, payments, ledger and bank'),
  P('accounting.create', 'Create accounting records', 'Create invoices, bills, expenses, journals'),
  P('accounting.update', 'Edit / post accounting records', 'Edit and post payments, bills and transfers', { danger: true }),
  P('accounting.delete', 'Delete accounting records', 'Void or delete accounting records', { danger: true }),
  P('invoices.generate', 'Generate invoices', 'Create proforma and tax invoices', {
    legacy: { allExcept: ['sales', 'sales_executive', 'sales_manager', 'operations_manager', 'operations'] },
  }),
  P('reports.read', 'View financial reports', 'Trial balance, P&L, balance sheet, cash flow, VAT'),

  // ── Commissions ──────────────────────────────────────────────────────
  P('commissions.view_own', 'View own commissions', 'See own commission statement', { legacy: { roles: ['sales', 'sales_executive', 'sales_manager'] } }),
  P('commissions.manage', 'Manage commissions', 'Set commission rates and view all statements', { danger: true, legacy: { inherit: ['users.update'] } }),

  // ── HR ───────────────────────────────────────────────────────────────
  P('hr.employees.read', 'View employees', 'See employee records'),
  P('hr.employees.manage', 'Manage employees', 'Create and edit employees, approve profile changes', { danger: true }),
  P('hr.attendance.read', 'View attendance', 'See attendance'),
  P('hr.attendance.manage', 'Manage attendance', 'Edit attendance sheet, approve regularizations'),
  P('hr.leave.read', 'View leave', 'See leave requests'),
  P('hr.leave.approve', 'Approve leave', 'Approve or reject leave requests'),
  P('hr.payroll.read', 'View payroll', 'See payroll runs and payslips'),
  P('hr.payroll.process', 'Process payroll', 'Run, approve and pay payroll', { danger: true }),
  P('hr.settings.manage', 'Manage HR settings', 'Departments, leave types, holidays'),
  P('hr.access_all', 'Full HR visibility', 'See every employee’s HR data regardless of reporting line', {
    danger: true, legacy: { roles: ['hr_manager', ...ADMIN_ROLES] },
  }),

  // ── Workflow / system capabilities ───────────────────────────────────
  P('workflow.manager', 'Manager authority', 'Approve leads and deals, and change statuses directly from edit forms', {
    danger: true, legacy: { roles: ['sales_manager', ...ADMIN_ROLES] },
  }),
  P('orders.modify', 'Modify quotations & orders', 'Create, edit, approve and delete quotations and purchase orders (off = view only)', {
    legacy: { allExcept: ['operations_manager', 'operations'] },
  }),
  P('driver.app', 'Use driver app', 'Access the mobile driver pickup app', { legacy: { roles: ['driver', 'operations_manager', ...ADMIN_ROLES] } }),

  // ── Administration ───────────────────────────────────────────────────
  P('users.read', 'View users', 'See user accounts'),
  P('users.create', 'Create users', 'Add user accounts', { danger: true }),
  P('users.update', 'Edit users', 'Edit user accounts and reset passwords', { danger: true }),
  P('users.delete', 'Delete users', 'Remove user accounts', { danger: true }),
  P('users.impersonate', 'Impersonate users', 'Sign in as another user', { danger: true }),
  P('roles.read', 'View roles', 'See roles and their permissions'),
  P('roles.create', 'Create roles', 'Create and clone roles', { danger: true }),
  P('roles.update', 'Edit roles & access', 'Change role permissions and per-user overrides', { danger: true }),
  P('roles.delete', 'Delete roles', 'Delete custom roles', { danger: true }),
  P('settings.manage', 'Manage company settings', 'Company profile, logo, master data and dropdowns', {
    danger: true, legacy: { roles: ADMIN_ROLES },
  }),
];

/**
 * Data scope modules. A scope limits *which records* a role sees.
 *   own  -> only records the user created / is assigned to
 *   team -> the user's direct reports (via employee manager link) and themselves
 *   all  -> everything in the tenant
 */
const DATA_SCOPES = [
  {
    key: 'crm_records',
    label: 'CRM records',
    description: 'Leads, deals, clients, contacts, quotations, purchase orders, invoices and inspection requests',
    scopes: ['own', 'all'],
    default: 'all',
    legacy: { own: ['sales'] },
  },
  {
    key: 'hr_leave',
    label: 'HR · Leave requests',
    description: 'Whose leave requests the user can view and approve',
    scopes: ['own', 'team', 'all'],
    default: 'all',
    legacy: { team: ['sales_manager', 'operations_manager'] },
  },
  {
    key: 'hr_attendance',
    label: 'HR · Attendance',
    description: 'Whose attendance the user can view and approve',
    scopes: ['own', 'team', 'all'],
    default: 'all',
    legacy: { team: ['sales_manager', 'operations_manager'] },
  },
];

/** Field visibility groups. A role can have a group hidden (values are redacted by the API). */
const FIELD_GROUPS = [
  {
    key: 'financials',
    label: 'Prices & amounts',
    description: 'Deal totals, VAT, unit prices, line totals, invoice amounts and PO prices',
    legacyHidden: ['operations_manager'],
  },
];

/** Roles that keep operations.* wildcard behaviour from before the permission matrix was editable. */
const LEGACY_TIGHTEN = [
  // role names -> permissions to REMOVE on first run so the matrix reflects real behaviour
  { roles: ['operations_manager', 'operations'], remove: ['quotations.update', 'quotations.approve', 'purchase_orders.update', 'purchase_orders.approve'] },
  // Sales roles never authored inspection reports or created work orders (UI + API enforced it by role name)
  { roles: ['sales', 'sales_executive', 'sales_manager'], remove: ['operations.create', 'inspection_reports.create', 'inspection_reports.update'] },
];

/** Roles that previously matched permission prefixes implicitly (fuzzy rules) — grant explicitly. */
const LEGACY_PREFIX_GRANTS = [
  { roles: ['operations_manager'], prefix: 'operations.' },
  { roles: ['accounts'], prefix: 'accounting.' },
  { roles: ['accounts'], prefix: 'reports.' },
];

const ACTION_LABELS = {
  read: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
};
const STANDARD_ACTIONS = Object.keys(ACTION_LABELS);

const catalogByName = Object.fromEntries(PERMISSIONS.map((p) => [p.name, p]));

module.exports = {
  MODULES,
  PERMISSIONS,
  DATA_SCOPES,
  FIELD_GROUPS,
  LEGACY_TIGHTEN,
  LEGACY_PREFIX_GRANTS,
  ACTION_LABELS,
  STANDARD_ACTIONS,
  catalogByName,
  ADMIN_ROLES,
};
