const db = require('../models');
const ApiError = require('../utils/apiError');

const getTenantSettings = async tenantId => {
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Tenant not found');

  return {
    company_name: tenant.company_name,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    city: tenant.city,
    country: tenant.country,
    currency: tenant.currency,
    timezone: tenant.timezone,
    date_format: tenant.date_format,
    tax_registration_number: tenant.tax_registration_number,
    logo_url: tenant.logo_url,
    is_active: tenant.is_active,
  };
};

const updateTenantSettings = async (tenantId, data) => {
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Tenant not found');

  await tenant.update({
    company_name: data.companyName || tenant.company_name,
    email: data.email || tenant.email,
    phone: data.phone || tenant.phone,
    address: data.address || tenant.address,
    city: data.city || tenant.city,
    country: data.country || tenant.country,
    currency: data.currency || tenant.currency,
    timezone: data.timezone || tenant.timezone,
    date_format: data.dateFormat || tenant.date_format,
    tax_registration_number: data.taxRegistrationNumber || tenant.tax_registration_number,
    logo_url: data.logoUrl || tenant.logo_url,
  });

  return getTenantSettings(tenantId);
};

// Masters Management
const getAllCurrencies = async tenantId => {
  return await db.Currency.findAll({
    where: { tenant_id: tenantId, is_active: true },
    order: [['code', 'ASC']],
  });
};

const createCurrency = async (tenantId, data) => {
  return await db.Currency.create({
    tenant_id: tenantId,
    code: data.code,
    name: data.name,
    symbol: data.symbol,
    exchange_rate: data.exchangeRate || 1,
    is_active: true,
  });
};

const updateCurrency = async (tenantId, currencyId, data) => {
  const currency = await db.Currency.findOne({
    where: { id: currencyId, tenant_id: tenantId },
  });
  if (!currency) throw ApiError.notFound('Currency not found');

  await currency.update({
    name: data.name || currency.name,
    symbol: data.symbol || currency.symbol,
    exchange_rate: data.exchangeRate ?? currency.exchange_rate,
    is_active: data.isActive ?? currency.is_active,
  });

  return currency;
};

const getAllTaxes = async tenantId => {
  return await db.Tax.findAll({
    where: { tenant_id: tenantId },
    order: [['name', 'ASC']],
  });
};

const createTax = async (tenantId, data) => {
  return await db.Tax.create({
    tenant_id: tenantId,
    name: data.name,
    rate: data.rate,
    tax_type: data.taxType,
    is_default: data.isDefault || false,
  });
};

const updateTax = async (tenantId, taxId, data) => {
  const tax = await db.Tax.findOne({
    where: { id: taxId, tenant_id: tenantId },
  });
  if (!tax) throw ApiError.notFound('Tax not found');

  await tax.update({
    name: data.name || tax.name,
    rate: data.rate ?? tax.rate,
    tax_type: data.taxType || tax.tax_type,
    is_default: data.isDefault ?? tax.is_default,
  });

  return tax;
};

const getAllPaymentModes = async tenantId => {
  return await db.PaymentMode.findAll({
    where: { tenant_id: tenantId, is_active: true },
    order: [['name', 'ASC']],
  });
};

const createPaymentMode = async (tenantId, data) => {
  return await db.PaymentMode.create({
    tenant_id: tenantId,
    name: data.name,
    description: data.description,
    is_active: true,
  });
};

const updatePaymentMode = async (tenantId, modeId, data) => {
  const mode = await db.PaymentMode.findOne({
    where: { id: modeId, tenant_id: tenantId },
  });
  if (!mode) throw ApiError.notFound('Payment mode not found');

  await mode.update({
    name: data.name || mode.name,
    description: data.description || mode.description,
    is_active: data.isActive ?? mode.is_active,
  });

  return mode;
};

const getAllExpenseCategories = async tenantId => {
  return await db.ExpenseCategory.findAll({
    where: { tenant_id: tenantId },
    order: [['name', 'ASC']],
  });
};

const createExpenseCategory = async (tenantId, data) => {
  return await db.ExpenseCategory.create({
    tenant_id: tenantId,
    name: data.name,
    description: data.description,
  });
};

const updateExpenseCategory = async (tenantId, categoryId, data) => {
  const category = await db.ExpenseCategory.findOne({
    where: { id: categoryId, tenant_id: tenantId },
  });
  if (!category) throw ApiError.notFound('Expense category not found');

  await category.update({
    name: data.name || category.name,
    description: data.description || category.description,
  });

  return category;
};

const getAllMaterialTypes = async tenantId => {
  return await db.MaterialType.findAll({
    where: { tenant_id: tenantId, is_active: true },
    order: [['category', 'ASC'], ['name', 'ASC']],
  });
};

const createMaterialType = async (tenantId, data) => {
  return await db.MaterialType.create({
    tenant_id: tenantId,
    name: data.name,
    category: data.category,
    description: data.description,
    unit_of_measure: data.unitOfMeasure,
    is_active: true,
  });
};

const updateMaterialType = async (tenantId, typeId, data) => {
  const type = await db.MaterialType.findOne({
    where: { id: typeId, tenant_id: tenantId },
  });
  if (!type) throw ApiError.notFound('Material type not found');

  await type.update({
    name: data.name || type.name,
    category: data.category || type.category,
    description: data.description || type.description,
    unit_of_measure: data.unitOfMeasure || type.unit_of_measure,
    is_active: data.isActive ?? type.is_active,
  });

  return type;
};

module.exports = {
  getTenantSettings,
  updateTenantSettings,
  getAllCurrencies,
  createCurrency,
  updateCurrency,
  getAllTaxes,
  createTax,
  updateTax,
  getAllPaymentModes,
  createPaymentMode,
  updatePaymentMode,
  getAllExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  getAllMaterialTypes,
  createMaterialType,
  updateMaterialType,
};
