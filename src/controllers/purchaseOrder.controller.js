const purchaseOrderService = require('../services/purchaseOrder.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, supplierId, dealId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await purchaseOrderService.getAll(req.tenant.id, {
    ...pagination,
    search,
    supplierId,
    dealId,
  });
  return ApiResponse.paginated(res, result.purchaseOrders, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, po);
});

const create = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, po, 'Purchase order created successfully');
});

const update = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, po, 'Purchase order updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await purchaseOrderService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Purchase order deleted');
});

module.exports = { getAll, getById, create, update, remove };
