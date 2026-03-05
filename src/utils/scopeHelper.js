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

/**
 * Get company IDs linked to leads/deals the sales user can access.
 * Used to expand company scope: sales sees companies they created + companies on their leads/deals.
 */
async function getSalesRelatedCompanyIds(db, tenantId, scopeUserId) {
  const [rows] = await db.sequelize.query(
    `SELECT DISTINCT company_id FROM leads 
     WHERE tenant_id = ? AND (assigned_to = ? OR created_by = ?) AND company_id IS NOT NULL
     UNION
     SELECT DISTINCT company_id FROM deals 
     WHERE tenant_id = ? AND assigned_to = ? AND company_id IS NOT NULL`,
    { replacements: [tenantId, scopeUserId, scopeUserId, tenantId, scopeUserId] }
  );
  return rows.map(r => r.company_id).filter(Boolean);
}

/**
 * Get contact IDs linked to leads/deals the sales user can access.
 */
async function getSalesRelatedContactIds(db, tenantId, scopeUserId) {
  const [rows] = await db.sequelize.query(
    `SELECT DISTINCT contact_id FROM leads 
     WHERE tenant_id = ? AND (assigned_to = ? OR created_by = ?) AND contact_id IS NOT NULL
     UNION
     SELECT DISTINCT contact_id FROM deals 
     WHERE tenant_id = ? AND assigned_to = ? AND contact_id IS NOT NULL`,
    { replacements: [tenantId, scopeUserId, scopeUserId, tenantId, scopeUserId] }
  );
  return rows.map(r => r.contact_id).filter(Boolean);
}

module.exports = { getSalesScope, getSalesRelatedCompanyIds, getSalesRelatedContactIds };
