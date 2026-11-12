const svc = require('../services/supplierDebitNote.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, supplierId, vendorBillId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await svc.listDebitNotes(req.tenant.id, { ...pagination, search, supplierId, vendorBillId });
  return ApiResponse.paginated(res, result.debitNotes, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const billInfo = asyncHandler(async (req, res) => ApiResponse.success(res, await svc.getBillDebitInfo(req.tenant.id, req.params.vendorBillId)));
const getById = asyncHandler(async (req, res) => ApiResponse.success(res, await svc.getDebitNote(req.tenant.id, req.params.id)));
const create = asyncHandler(async (req, res) => ApiResponse.created(res, await svc.createDebitNote(req.tenant.id, req.user.id, req.body), 'Debit note recorded'));

module.exports = { list, billInfo, getById, create };
