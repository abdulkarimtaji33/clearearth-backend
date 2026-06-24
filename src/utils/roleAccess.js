const ApiError = require('./apiError');

const INVOICE_GENERATION_BLOCKED_ROLES = new Set(['sales', 'sales_executive', 'sales_manager']);
const OPERATIONS_ROLES = new Set(['operations_manager', 'operations']);

function roleNameFromRequest(req) {
  return req.user?.role?.name || req.user?.Role?.name || null;
}

function assertCanGenerateInvoice(req) {
  const role = roleNameFromRequest(req);
  if (INVOICE_GENERATION_BLOCKED_ROLES.has(role)) {
    throw ApiError.forbidden('Sales users cannot create proforma or tax invoices');
  }
}

function isOperationsRole(role) {
  return OPERATIONS_ROLES.has(role);
}

module.exports = {
  INVOICE_GENERATION_BLOCKED_ROLES,
  OPERATIONS_ROLES,
  roleNameFromRequest,
  assertCanGenerateInvoice,
  isOperationsRole,
};
