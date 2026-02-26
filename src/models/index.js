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

// Contacts, Companies & Suppliers
const Contact = require('./Contact')(sequelize, DataTypes);
const CompanyContact = require('./CompanyContact')(sequelize, DataTypes);
const Company = require('./Company')(sequelize, DataTypes);
const SupplierContact = require('./SupplierContact')(sequelize, DataTypes);
const Supplier = require('./Supplier')(sequelize, DataTypes);

// CRM
const Lead = require('./Lead')(sequelize, DataTypes);

// Products & Services
const ProductService = require('./ProductService')(sequelize, DataTypes);

// Deals
const Deal = require('./Deal')(sequelize, DataTypes);
const DealItem = require('./DealItem')(sequelize, DataTypes);
const DealWds = require('./DealWds')(sequelize, DataTypes);

// Terms and Conditions
const TermsAndConditions = require('./termsAndConditions.model')(sequelize, DataTypes);

// Dropdown Tables
const Designation = require('./Designation')(sequelize, DataTypes);
const IndustryType = require('./IndustryType')(sequelize, DataTypes);
const UaeCity = require('./UaeCity')(sequelize, DataTypes);
const Country = require('./Country')(sequelize, DataTypes);
const LeadSource = require('./LeadSource')(sequelize, DataTypes);
const ContactRole = require('./ContactRole')(sequelize, DataTypes);
const ServiceInterest = require('./ServiceInterest')(sequelize, DataTypes);
const ProductCategory = require('./ProductCategory')(sequelize, DataTypes);
const UnitOfMeasure = require('./UnitOfMeasure')(sequelize, DataTypes);
const DealStatus = require('./DealStatus')(sequelize, DataTypes);
const PaymentStatus = require('./PaymentStatus')(sequelize, DataTypes);
const Status = require('./Status')(sequelize, DataTypes);

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
  Contact,
  CompanyContact,
  Company,
  SupplierContact,
  Supplier,
  Lead,
  ProductService,
  Deal,
  DealItem,
  DealWds,
  TermsAndConditions,
  Designation,
  IndustryType,
  UaeCity,
  Country,
  LeadSource,
  ContactRole,
  ServiceInterest,
  ProductCategory,
  UnitOfMeasure,
  DealStatus,
  PaymentStatus,
  Status,
};

// Define Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
