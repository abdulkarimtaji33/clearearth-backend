const vendorBillService = require('../services/vendorBill.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const awaitingBill = asyncHandler(async (req, res) => {
  const rows = await vendorBillService.listAwaitingBill(req.tenant.id);
  return ApiResponse.success(res, rows);
});

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, supplierId, purchaseOrderId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await vendorBillService.listBills(req.tenant.id, { ...pagination, search, status, supplierId, purchaseOrderId });
  return ApiResponse.paginated(res, result.bills, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const row = await vendorBillService.getBill(req.tenant.id, req.params.id);
  return ApiResponse.success(res, row);
});

const create = asyncHandler(async (req, res) => {
  const row = await vendorBillService.createBill(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Vendor bill recorded');
});

const createDirect = asyncHandler(async (req, res) => {
  const row = await vendorBillService.createDirectBill(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Supplier bill recorded');
});

const pay = asyncHandler(async (req, res) => {
  const result = await vendorBillService.payBills(req.tenant.id, req.user.id, req.body);
  return ApiResponse.success(res, result, 'Supplier payment recorded');
});

module.exports = { awaitingBill, list, getById, create, createDirect, pay };
