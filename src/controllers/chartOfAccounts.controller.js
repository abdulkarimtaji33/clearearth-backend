const coaService = require('../services/chartOfAccounts.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const listAccounts = asyncHandler(async (req, res) => {
  const { type, isActive, withBalance, asOfDate } = req.query;
  const accounts = await coaService.listAccounts(req.tenant.id, { type, isActive, withBalance, asOfDate });
  return ApiResponse.success(res, accounts);
});

const getAccount = asyncHandler(async (req, res) => {
  const account = await coaService.getAccountById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, account);
});

const createAccount = asyncHandler(async (req, res) => {
  const account = await coaService.createAccount(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, account, 'Account created');
});

const updateAccount = asyncHandler(async (req, res) => {
  const account = await coaService.updateAccount(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, account, 'Account updated');
});

const deleteAccount = asyncHandler(async (req, res) => {
  const result = await coaService.deleteAccount(req.tenant.id, req.params.id);
  return ApiResponse.success(res, result, 'Account disabled');
});

const seedAccounts = asyncHandler(async (req, res) => {
  const result = await coaService.seedDefaultAccounts(req.tenant.id, req.user.id);
  return ApiResponse.success(res, result, result.seeded ? 'Default accounts seeded' : 'Accounts already exist');
});

module.exports = { listAccounts, getAccount, createAccount, updateAccount, deleteAccount, seedAccounts };
