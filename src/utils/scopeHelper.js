/**
 * Helper to build scope filters for sales role (own records only).
 * Sales Manager: no scope (sees all).
 * Sales: scopeUserId = req.user.id (sees own records only).
 */
function getSalesScope(req) {
  if (!req?.user?.role?.name) return {};
  if (req.user.role.name === 'sales') {
    return { scopeUserId: req.user.id };
  }
  return {};
}

module.exports = { getSalesScope };
