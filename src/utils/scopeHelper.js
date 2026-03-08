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
 * Get all company IDs the sales user can access (from leads/deals + created by them).
 */
async function getSalesAccessibleCompanyIds(db, tenantId, scopeUserId) {
  const fromLeadsDeals = await getSalesRelatedCompanyIds(db, tenantId, scopeUserId);
  const [createdRows] = await db.sequelize.query(
    `SELECT id FROM companies WHERE tenant_id = ? AND created_by = ?`,
    { replacements: [tenantId, scopeUserId] }
  );
  const createdIds = (createdRows || []).map(r => r.id).filter(Boolean);
  return [...new Set([...fromLeadsDeals, ...createdIds])];
}

/**
 * Get contact IDs linked to leads/deals the sales user can access.
 * Also includes contacts belonging to companies the sales user can access.
 */
async function getSalesRelatedContactIds(db, tenantId, scopeUserId) {
  const companyIds = await getSalesAccessibleCompanyIds(db, tenantId, scopeUserId);
  const [leadDealRows] = await db.sequelize.query(
    `SELECT DISTINCT contact_id FROM leads 
     WHERE tenant_id = ? AND (assigned_to = ? OR created_by = ?) AND contact_id IS NOT NULL
     UNION
     SELECT DISTINCT contact_id FROM deals 
     WHERE tenant_id = ? AND assigned_to = ? AND contact_id IS NOT NULL`,
    { replacements: [tenantId, scopeUserId, scopeUserId, tenantId, scopeUserId] }
  );
  const fromLeadsDeals = leadDealRows.map(r => r.contact_id).filter(Boolean);
  let fromCompanies = [];
  if (companyIds.length > 0) {
    const [byCompanyId] = await db.sequelize.query(
      `SELECT id FROM contacts WHERE tenant_id = ? AND company_id IN (?)`,
      { replacements: [tenantId, companyIds] }
    );
    const [byCompanyContact] = await db.sequelize.query(
      `SELECT contact_id as id FROM company_contacts WHERE company_id IN (?)`,
      { replacements: [companyIds] }
    );
    fromCompanies = [...(byCompanyId || []).map(r => r.id), ...(byCompanyContact || []).map(r => r.id)].filter(Boolean);
  }
  return [...new Set([...fromLeadsDeals, ...fromCompanies])];
}

module.exports = { getSalesScope, getSalesRelatedCompanyIds, getSalesAccessibleCompanyIds, getSalesRelatedContactIds };
