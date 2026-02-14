/**
 * Models Index - Initialize all models and associations
 */
const { sequelize, Sequelize } = require('../database');
const { DataTypes } = Sequelize;

// Import models
const Tenant = require('./Tenant')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Role = require('./Role')(sequelize, DataTypes);
const Permission = require('./Permission')(sequelize, DataTypes);
const RolePermission = require('./RolePermission')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);

// Clients & Vendors
const Client = require('./Client')(sequelize, DataTypes);
const Vendor = require('./Vendor')(sequelize, DataTypes);

// CRM
const Lead = require('./Lead')(sequelize, DataTypes);
const Deal = require('./Deal')(sequelize, DataTypes);
const DealStage = require('./DealStage')(sequelize, DataTypes);

// Products & Services
const Product = require('./Product')(sequelize, DataTypes);
const Service = require('./Service')(sequelize, DataTypes);

// Masters/Configuration
const Currency = require('./Currency')(sequelize, DataTypes);
const Tax = require('./Tax')(sequelize, DataTypes);
const PaymentMode = require('./PaymentMode')(sequelize, DataTypes);
const ExpenseCategory = require('./ExpenseCategory')(sequelize, DataTypes);
const MaterialType = require('./MaterialType')(sequelize, DataTypes);

// Inventory
const Warehouse = require('./Warehouse')(sequelize, DataTypes);
const Lot = require('./Lot')(sequelize, DataTypes);
const Inventory = require('./Inventory')(sequelize, DataTypes);
const StockMovement = require('./StockMovement')(sequelize, DataTypes);

// Operations
const Job = require('./Job')(sequelize, DataTypes);
const Inspection = require('./Inspection')(sequelize, DataTypes);
const GoodsReceiptNote = require('./GoodsReceiptNote')(sequelize, DataTypes);

// Accounting & Finance
const ChartOfAccount = require('./ChartOfAccount')(sequelize, DataTypes);
const JournalEntry = require('./JournalEntry')(sequelize, DataTypes);
const JournalEntryLine = require('./JournalEntryLine')(sequelize, DataTypes);
const Invoice = require('./Invoice')(sequelize, DataTypes);
const InvoiceLine = require('./InvoiceLine')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Cheque = require('./Cheque')(sequelize, DataTypes);
const FixedAsset = require('./FixedAsset')(sequelize, DataTypes);
const Depreciation = require('./Depreciation')(sequelize, DataTypes);

// Commission
const Commission = require('./Commission')(sequelize, DataTypes);
const CommissionPolicy = require('./CommissionPolicy')(sequelize, DataTypes);

// Documents
const Document = require('./Document')(sequelize, DataTypes);

// Certificates
const Certificate = require('./Certificate')(sequelize, DataTypes);
const CertificateTemplate = require('./CertificateTemplate')(sequelize, DataTypes);

// Fleet & Logistics
const Vehicle = require('./Vehicle')(sequelize, DataTypes);
const Driver = require('./Driver')(sequelize, DataTypes);
const Trip = require('./Trip')(sequelize, DataTypes);
const FuelLog = require('./FuelLog')(sequelize, DataTypes);
const MaintenanceLog = require('./MaintenanceLog')(sequelize, DataTypes);

// HR & Payroll
const Employee = require('./Employee')(sequelize, DataTypes);
const Leave = require('./Leave')(sequelize, DataTypes);
const Attendance = require('./Attendance')(sequelize, DataTypes);
const Payroll = require('./Payroll')(sequelize, DataTypes);
const PayrollLine = require('./PayrollLine')(sequelize, DataTypes);
const AssetCustody = require('./AssetCustody')(sequelize, DataTypes);

// Create db object with all models
const db = {
  sequelize,
  Sequelize,
  Tenant,
  User,
  Role,
  Permission,
  RolePermission,
  AuditLog,
  Client,
  Vendor,
  Lead,
  Deal,
  DealStage,
  Product,
  Service,
  Currency,
  Tax,
  PaymentMode,
  ExpenseCategory,
  MaterialType,
  Warehouse,
  Lot,
  Inventory,
  StockMovement,
  Job,
  Inspection,
  GoodsReceiptNote,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  Invoice,
  InvoiceLine,
  Payment,
  Cheque,
  FixedAsset,
  Depreciation,
  Commission,
  CommissionPolicy,
  Document,
  Certificate,
  CertificateTemplate,
  Vehicle,
  Driver,
  Trip,
  FuelLog,
  MaintenanceLog,
  Employee,
  Leave,
  Attendance,
  Payroll,
  PayrollLine,
  AssetCustody,
};

// Define Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
