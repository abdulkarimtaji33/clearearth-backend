const ApiError = require('./apiError');

/**
 * Invoice-generation rule is now the `invoices.generate` permission (editable per role in the Roles UI).
 * The role-name sets below are only a fallback when no effective access is attached to the request.
 */
const INVOICE_GENERATION_BLOCKED_ROLES = new Set(['sales', 'sales_executive', 'sales_manager', 'operations_manager', 'operations']);
const OPERATIONS_ROLES = new Set(['operations_manager', 'operations']);

function roleNameFromRequest(req) {
  return req.user?.role?.name || req.user?.Role?.name || null;
}

function assertCanGenerateInvoice(req) {
  const access = req.access || req.user?.access;
  const allowed = access
    ? access.has('invoices.generate')
    : !INVOICE_GENERATION_BLOCKED_ROLES.has(roleNameFromRequest(req));
  if (!allowed) {
    throw ApiError.forbidden('Your role cannot create proforma or tax invoices');
  }
}

const SALES_ROLES = new Set(['sales', 'sales_executive', 'sales_manager']);

/**
 * Clients and vendors are kept separate per department: operations users only see (and create) operations
 * records, sales users only sales records. Other roles (administrators, accounts) see everything.
 * Returns 'operations', 'sales' or null (no restriction).
 */
function departmentOfRequest(req) {
  const role = roleNameFromRequest(req);
  if (OPERATIONS_ROLES.has(role)) return 'operations';
  if (SALES_ROLES.has(role)) return 'sales';
  return null;
}

function isOperationsRole(role) {
  return OPERATIONS_ROLES.has(role);
}

module.exports = {
  departmentOfRequest,
  INVOICE_GENERATION_BLOCKED_ROLES,
  OPERATIONS_ROLES,
  roleNameFromRequest,
  assertCanGenerateInvoice,
  isOperationsRole,
};
