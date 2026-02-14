const settingsService = require('../services/settings.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getTenantSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getTenantSettings(req.tenant.id);
  return ApiResponse.success(res, settings);
});

const updateTenantSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateTenantSettings(req.tenant.id, req.body);
  return ApiResponse.success(res, settings, 'Settings updated successfully');
});

// Currencies
const getAllCurrencies = asyncHandler(async (req, res) => {
  const currencies = await settingsService.getAllCurrencies(req.tenant.id);
  return ApiResponse.success(res, currencies);
});

const createCurrency = asyncHandler(async (req, res) => {
  const currency = await settingsService.createCurrency(req.tenant.id, req.body);
  return ApiResponse.created(res, currency, 'Currency created successfully');
});

const updateCurrency = asyncHandler(async (req, res) => {
  const currency = await settingsService.updateCurrency(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, currency, 'Currency updated successfully');
});

// Taxes
const getAllTaxes = asyncHandler(async (req, res) => {
  const taxes = await settingsService.getAllTaxes(req.tenant.id);
  return ApiResponse.success(res, taxes);
});

const createTax = asyncHandler(async (req, res) => {
  const tax = await settingsService.createTax(req.tenant.id, req.body);
  return ApiResponse.created(res, tax, 'Tax created successfully');
});

const updateTax = asyncHandler(async (req, res) => {
  const tax = await settingsService.updateTax(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, tax, 'Tax updated successfully');
});

// Payment Modes
const getAllPaymentModes = asyncHandler(async (req, res) => {
  const modes = await settingsService.getAllPaymentModes(req.tenant.id);
  return ApiResponse.success(res, modes);
});

const createPaymentMode = asyncHandler(async (req, res) => {
  const mode = await settingsService.createPaymentMode(req.tenant.id, req.body);
  return ApiResponse.created(res, mode, 'Payment mode created successfully');
});

const updatePaymentMode = asyncHandler(async (req, res) => {
  const mode = await settingsService.updatePaymentMode(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, mode, 'Payment mode updated successfully');
});

// Expense Categories
const getAllExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await settingsService.getAllExpenseCategories(req.tenant.id);
  return ApiResponse.success(res, categories);
});

const createExpenseCategory = asyncHandler(async (req, res) => {
  const category = await settingsService.createExpenseCategory(req.tenant.id, req.body);
  return ApiResponse.created(res, category, 'Expense category created successfully');
});

const updateExpenseCategory = asyncHandler(async (req, res) => {
  const category = await settingsService.updateExpenseCategory(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, category, 'Expense category updated successfully');
});

// Material Types
const getAllMaterialTypes = asyncHandler(async (req, res) => {
  const types = await settingsService.getAllMaterialTypes(req.tenant.id);
  return ApiResponse.success(res, types);
});

const createMaterialType = asyncHandler(async (req, res) => {
  const type = await settingsService.createMaterialType(req.tenant.id, req.body);
  return ApiResponse.created(res, type, 'Material type created successfully');
});

const updateMaterialType = asyncHandler(async (req, res) => {
  const type = await settingsService.updateMaterialType(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, type, 'Material type updated successfully');
});

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
