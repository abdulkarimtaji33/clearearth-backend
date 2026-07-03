const ApiError = require('./apiError');
const { shouldHideDealFinancials } = require('./dealFinancials');

function roleNameFromRequest(req) {
  return req.user?.role?.name || req.user?.Role?.name || null;
}

/**
 * Invoice generation requires holding proforma_invoices.create / tax_invoices.create.
 * Determined by whichever invoice route is calling — controllers pass the module.
 */
function assertCanGenerateInvoice(req, module = 'proforma_invoices') {
  if (req.user?.role?.name === 'super_admin') return;
  const hasPermission = req.user?.hasPermission || (() => false);
  if (!hasPermission(`${module}.create`)) {
    throw ApiError.forbidden('Your role cannot create proforma or tax invoices');
  }
}

/**
 * "Operations" roles today are simply roles that can see deals/quotations but not
 * pricing — same signal as shouldHideDealFinancials, kept as a distinct name for
 * readability at call sites that gate on visibility rather than editability.
 */
function isOperationsRole(userOrRoleName) {
  return shouldHideDealFinancials(userOrRoleName);
}

module.exports = {
  roleNameFromRequest,
  assertCanGenerateInvoice,
  isOperationsRole,
};
