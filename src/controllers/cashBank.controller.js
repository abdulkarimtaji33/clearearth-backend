const transfers = require('../services/cashBankTransfer.service');
const recon = require('../services/bankReconciliation.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const listTransfers = asyncHandler(async (req, res) => {
  const { page, pageSize, search, accountId, dateFrom, dateTo } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await transfers.listTransfers(req.tenant.id, { ...pagination, search, accountId, dateFrom, dateTo });
  return ApiResponse.paginated(res, result.transfers, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});
const createTransfer = asyncHandler(async (req, res) => ApiResponse.created(res, await transfers.createTransfer(req.tenant.id, req.user.id, req.body), 'Transfer recorded'));
const getTransfer = asyncHandler(async (req, res) => ApiResponse.success(res, await transfers.getTransfer(req.tenant.id, req.params.id)));

const workspace = asyncHandler(async (req, res) => ApiResponse.success(res, await recon.getWorkspace(req.tenant.id, req.query)));
const saveRecon = asyncHandler(async (req, res) => ApiResponse.success(res, await recon.save(req.tenant.id, req.user.id, req.body), 'Reconciliation saved'));
const listRecon = asyncHandler(async (req, res) => ApiResponse.success(res, await recon.list(req.tenant.id, req.query)));
const reportRecon = asyncHandler(async (req, res) => ApiResponse.success(res, await recon.getReport(req.tenant.id, req.params.id)));

module.exports = { listTransfers, createTransfer, getTransfer, workspace, saveRecon, listRecon, reportRecon };
