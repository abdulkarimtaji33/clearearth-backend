/**
 * Application Constants and Enums
 */

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};

// Record Status
const RECORD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETED: 'deleted',
};

// Lead Status
const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  PENDING_APPROVAL: 'pending_approval',
  QUALIFIED: 'qualified',
  DISQUALIFIED: 'disqualified',
  CONVERTED: 'converted',
};

const MANAGER_ROLES = ['sales_manager', 'admin', 'tenant_admin', 'super_admin'];

// Permissions Modules — source-of-truth registry. New permissions may only be
// created for modules listed here (constrains free-form permission creation
// to real, enforced parts of the app).
const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  CONTACTS: 'contacts',
  COMPANIES: 'companies',
  SUPPLIERS: 'suppliers',
  LEADS: 'leads',
  PRODUCTS: 'products',
  DEALS: 'deals',
  INSPECTION_REQUESTS: 'inspection_requests',
  INSPECTION_REPORTS: 'inspection_reports',
  OPERATIONS: 'operations',
  ACCOUNTING: 'accounting',
  GRN: 'grn',
  QUOTATIONS: 'quotations',
  PURCHASE_ORDERS: 'purchase_orders',
  REPORTS: 'reports',
  PROFORMA_INVOICES: 'proforma_invoices',
  TAX_INVOICES: 'tax_invoices',
};

// Default permission actions offered when creating a permission via the
// admin UI. Not DB-enforced — custom action strings are allowed per module.
const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
};

// Modules whose read/update/delete actions support per-role own-vs-all
// record scoping (e.g. sales sees only assigned/created records).
const SCOPED_MODULES = [
  'leads',
  'deals',
  'contacts',
  'companies',
  'quotations',
  'proforma_invoices',
  'tax_invoices',
  'inspection_requests',
];

const SCOPED_ACTIONS = ['read', 'update', 'delete'];

const SCOPES = {
  OWN: 'own',
  ALL: 'all',
};

// Modules with financial amounts that can be hidden from a role via a
// dedicated view_price permission instead of a hardcoded role check.
const FINANCIAL_MODULES = ['deals', 'quotations', 'purchase_orders', 'proforma_invoices', 'tax_invoices'];
const PRICE_ACTION = 'view_price';

module.exports = {
  USER_STATUS,
  RECORD_STATUS,
  LEAD_STATUS,
  MANAGER_ROLES,
  MODULES,
  ACTIONS,
  SCOPED_MODULES,
  SCOPED_ACTIONS,
  SCOPES,
  FINANCIAL_MODULES,
  PRICE_ACTION,
};
