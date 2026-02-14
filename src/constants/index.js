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

// Deal Status
const DEAL_STATUS = {
  DRAFT: 'draft',
  NEGOTIATION: 'negotiation',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  WON: 'won',
  LOST: 'lost',
  CANCELLED: 'cancelled',
};

// Deal Types
const DEAL_TYPE = {
  OFFER_TO_PURCHASE: 'offer_to_purchase',
  FREE_OF_COST: 'free_of_cost',
  OFFER_TO_SERVICE: 'offer_to_service',
};

// Department Stages
const DEPARTMENT_STAGE = {
  SALES: 'sales',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  LOGISTICS: 'logistics',
  WAREHOUSE: 'warehouse',
  COMPLETED: 'completed',
};

// Job Status
const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  INSPECTION: 'inspection',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Lot Status
const LOT_STATUS = {
  OPEN: 'open',
  WORK_IN_PROGRESS: 'work_in_progress',
  CLOSED: 'closed',
  SOLD: 'sold',
};

// Inventory Transaction Types
const INVENTORY_TRANSACTION_TYPE = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  INSPECTION: 'inspection',
  SORTING: 'sorting',
  PROCESSING: 'processing',
  DESTRUCTION: 'destruction',
};

// Invoice Types
const INVOICE_TYPE = {
  PROFORMA: 'proforma',
  COMMERCIAL: 'commercial',
  TAX_INVOICE: 'tax_invoice',
  CREDIT_NOTE: 'credit_note',
  DEBIT_NOTE: 'debit_note',
};

// Invoice Status
const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  SENT: 'sent',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  VOID: 'void',
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Payment Methods
const PAYMENT_METHOD = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  CREDIT_CARD: 'credit_card',
  ONLINE: 'online',
};

// Cheque Status
const CHEQUE_STATUS = {
  ISSUED: 'issued',
  DEPOSITED: 'deposited',
  CLEARED: 'cleared',
  BOUNCED: 'bounced',
  CANCELLED: 'cancelled',
};

// VAT Types
const VAT_TYPE = {
  STANDARD: 'standard', // 5%
  ZERO_RATED: 'zero_rated', // 0% for exports
  EXEMPT: 'exempt',
  REVERSE_CHARGE: 'reverse_charge',
  OUT_OF_SCOPE: 'out_of_scope',
};

// Transaction Types
const TRANSACTION_TYPE = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  EXPENSE: 'expense',
  RECEIPT: 'receipt',
  PAYMENT: 'payment',
  JOURNAL: 'journal',
  ADJUSTMENT: 'adjustment',
};

// Commission Status
const COMMISSION_STATUS = {
  PENDING: 'pending',
  CALCULATED: 'calculated',
  APPROVED: 'approved',
  PAID: 'paid',
  REVERSED: 'reversed',
};

// Commission Basis
const COMMISSION_BASIS = {
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  MARGIN: 'margin',
};

// Document Types
const DOCUMENT_TYPE = {
  CONTRACT: 'contract',
  CERTIFICATE: 'certificate',
  PERMIT: 'permit',
  LICENSE: 'license',
  GOODS_RECEIPT: 'goods_receipt',
  INVOICE: 'invoice',
  CUSTOMS: 'customs',
  DESTRUCTION_CERT: 'destruction_certificate',
  GREEN_CERT: 'green_certificate',
  PHOTO: 'photo',
  REPORT: 'report',
  OTHER: 'other',
};

// Certificate Types
const CERTIFICATE_TYPE = {
  DESTRUCTION: 'destruction',
  RECYCLING: 'recycling',
  ENVIRONMENTAL: 'environmental',
  GREEN: 'green',
  DISPOSAL: 'disposal',
};

// Vehicle Status
const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
};

// Trip Status
const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Employee Status
const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  RESIGNED: 'resigned',
  TERMINATED: 'terminated',
};

// Leave Status
const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Payroll Status
const PAYROLL_STATUS = {
  DRAFT: 'draft',
  CALCULATED: 'calculated',
  APPROVED: 'approved',
  PAID: 'paid',
};

// Asset Status
const ASSET_STATUS = {
  ACTIVE: 'active',
  DISPOSED: 'disposed',
  WRITTEN_OFF: 'written_off',
};

// Depreciation Methods
const DEPRECIATION_METHOD = {
  STRAIGHT_LINE: 'straight_line',
  REDUCING_BALANCE: 'reducing_balance',
};

// Material Categories
const MATERIAL_CATEGORY = {
  PLASTIC: 'plastic',
  METAL: 'metal',
  PAPER: 'paper',
  GLASS: 'glass',
  ELECTRONICS: 'electronics',
  HAZARDOUS: 'hazardous',
  ORGANIC: 'organic',
  MIXED: 'mixed',
  OTHER: 'other',
};

// Service Categories
const SERVICE_CATEGORY = {
  COLLECTION: 'collection',
  DISPOSAL: 'disposal',
  RECYCLING: 'recycling',
  DESTRUCTION: 'destruction',
  ITAD: 'itad',
  CONSULTING: 'consulting',
  OTHER: 'other',
};

// Unit of Measure
const UNIT_OF_MEASURE = {
  KG: 'kg',
  TONS: 'tons',
  UNITS: 'units',
  LITERS: 'liters',
  METERS: 'meters',
  PIECES: 'pieces',
};

// User Roles
const USER_ROLE = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  MANAGER: 'manager',
  SALES_PERSON: 'sales_person',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  WAREHOUSE: 'warehouse',
  HR: 'hr',
  DRIVER: 'driver',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer',
};

// Permission Actions
const PERMISSION_ACTION = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
};

// Modules
const MODULE = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  VENDORS: 'vendors',
  LEADS: 'leads',
  DEALS: 'deals',
  PRODUCTS: 'products',
  SERVICES: 'services',
  ACCOUNTING: 'accounting',
  COMMISSIONS: 'commissions',
  DOCUMENTS: 'documents',
  OPERATIONS: 'operations',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  USERS: 'users',
  MASTERS: 'masters',
  CERTIFICATES: 'certificates',
  FLEETS: 'fleets',
  HR: 'hr',
  PAYROLL: 'payroll',
  INBOUND: 'inbound',
  INVENTORY: 'inventory',
  OUTBOUND: 'outbound',
};

// Date Formats
const DATE_FORMAT = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm:ss',
};

// Expense Deductibility
const EXPENSE_DEDUCTIBILITY = {
  FULLY_DEDUCTIBLE: 'fully_deductible',
  NON_DEDUCTIBLE: 'non_deductible',
  PARTIALLY_DEDUCTIBLE: 'partially_deductible',
};

// Inspection Status
const INSPECTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PASSED: 'passed',
  FAILED: 'failed',
  CONDITIONAL: 'conditional',
};

// GRN Status
const GRN_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

module.exports = {
  USER_STATUS,
  RECORD_STATUS,
  LEAD_STATUS,
  DEAL_STATUS,
  DEAL_TYPE,
  DEPARTMENT_STAGE,
  JOB_STATUS,
  LOT_STATUS,
  INVENTORY_TRANSACTION_TYPE,
  INVOICE_TYPE,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  CHEQUE_STATUS,
  VAT_TYPE,
  TRANSACTION_TYPE,
  COMMISSION_STATUS,
  COMMISSION_BASIS,
  DOCUMENT_TYPE,
  CERTIFICATE_TYPE,
  VEHICLE_STATUS,
  TRIP_STATUS,
  EMPLOYEE_STATUS,
  LEAVE_STATUS,
  PAYROLL_STATUS,
  ASSET_STATUS,
  DEPRECIATION_METHOD,
  MATERIAL_CATEGORY,
  SERVICE_CATEGORY,
  UNIT_OF_MEASURE,
  USER_ROLE,
  PERMISSION_ACTION,
  MODULE,
  DATE_FORMAT,
  EXPENSE_DEDUCTIBILITY,
  INSPECTION_STATUS,
  GRN_STATUS,
};
