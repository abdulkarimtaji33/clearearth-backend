const accountingService = require('../services/accounting.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAllJournalEntries = asyncHandler(async (req, res) => {
  const { page, pageSize, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await accountingService.getAllJournalEntries(req.tenant.id, { ...pagination, startDate, endDate });
  return ApiResponse.paginated(res, result.entries, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getJournalEntryById = asyncHandler(async (req, res) => {
  const entry = await accountingService.getJournalEntryById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, entry);
});

const createJournalEntry = asyncHandler(async (req, res) => {
  const entry = await accountingService.createJournalEntry(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, entry, 'Journal entry created successfully');
});

const getAllExpenses = asyncHandler(async (req, res) => {
  const { page, pageSize, categoryId, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await accountingService.getAllExpenses(req.tenant.id, { ...pagination, categoryId, startDate, endDate });
  return ApiResponse.paginated(res, result.expenses, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const createExpense = asyncHandler(async (req, res) => {
  const expense = await accountingService.createExpense(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, expense, 'Expense created successfully');
});

const approveExpense = asyncHandler(async (req, res) => {
  const expense = await accountingService.approveExpense(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, expense, 'Expense approved');
});

const getAllFixedAssets = asyncHandler(async (req, res) => {
  const assets = await accountingService.getAllFixedAssets(req.tenant.id);
  return ApiResponse.success(res, assets);
});

const createFixedAsset = asyncHandler(async (req, res) => {
  const asset = await accountingService.createFixedAsset(req.tenant.id, req.body);
  return ApiResponse.created(res, asset, 'Fixed asset created successfully');
});

const calculateDepreciation = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const result = await accountingService.calculateDepreciation(req.tenant.id, month, year);
  return ApiResponse.success(res, result, 'Depreciation calculated');
});

const getBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountingService.getBankAccounts(req.tenant.id);
  return ApiResponse.success(res, accounts);
});

const createBankAccount = asyncHandler(async (req, res) => {
  const account = await accountingService.createBankAccount(req.tenant.id, req.body);
  return ApiResponse.created(res, account, 'Bank account created successfully');
});

module.exports = {
  getAllJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  getAllExpenses,
  createExpense,
  approveExpense,
  getAllFixedAssets,
  createFixedAsset,
  calculateDepreciation,
  getBankAccounts,
  createBankAccount,
};
