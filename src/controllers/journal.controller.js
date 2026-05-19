const jeService = require('../services/journalEntry.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const listEntries = asyncHandler(async (req, res) => {
  const { page, pageSize, dateFrom, dateTo, sourceType, search, accountId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await jeService.listJournalEntries(req.tenant.id, {
    ...pagination,
    dateFrom,
    dateTo,
    sourceType,
    search,
    accountId,
  });
  return ApiResponse.paginated(res, result.entries, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getEntry = asyncHandler(async (req, res) => {
  const entry = await jeService.getJournalEntryById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, entry);
});

const createManualEntry = asyncHandler(async (req, res) => {
  const entry = await jeService.createManualEntry(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, entry, 'Journal entry created');
});

const postOpeningBalances = asyncHandler(async (req, res) => {
  const { entryDate, balances } = req.body;
  await jeService.createOpeningBalanceEntry(req.tenant.id, req.user.id, { entryDate, balances });
  return ApiResponse.success(res, null, 'Opening balances posted');
});

const voidEntry = asyncHandler(async (req, res) => {
  const entry = await jeService.voidJournalEntry(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, entry, 'Journal entry voided');
});

module.exports = { listEntries, getEntry, createManualEntry, postOpeningBalances, voidEntry };
