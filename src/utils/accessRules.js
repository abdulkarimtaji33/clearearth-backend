/**
 * The "you can only hand out permissions you hold yourself" rule exists to stop privilege escalation.
 * These permissions do not give power over anyone's data or actions, so an administrator may hand them out
 * even if their own role does not carry them:
 *   - dashboard.view_*      only picks which dashboard a person sees (view_super_admin stays protected)
 *   - commissions.view_own  shows the person their own commissions
 *   - inspection_reports.perform  lets the person be an inspector
 */
const NON_ESCALATING = new Set(['commissions.view_own', 'inspection_reports.perform']);

function isNonEscalating(permissionName) {
  const n = String(permissionName || '');
  if (n === 'dashboard.view_super_admin') return false;
  return n.startsWith('dashboard.view_') || NON_ESCALATING.has(n);
}

module.exports = { isNonEscalating };
