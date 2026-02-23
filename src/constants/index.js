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
  QUALIFIED: 'qualified',
  DISQUALIFIED: 'disqualified',
  CONVERTED: 'converted',
};

// Permissions Modules
const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  CONTACTS: 'contacts',
  COMPANIES: 'companies',
  SUPPLIERS: 'suppliers',
  LEADS: 'leads',
  PRODUCTS: 'products',
  DEALS: 'deals',
};

// Permission Actions
const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
};

module.exports = {
  USER_STATUS,
  RECORD_STATUS,
  LEAD_STATUS,
  MODULES,
  ACTIONS,
};
