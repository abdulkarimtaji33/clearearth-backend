const inventoryService = require('../services/inventory.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAllInventory = asyncHandler(async (req, res) => {
  const { page, pageSize, warehouseId, materialTypeId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await inventoryService.getAllInventory(req.tenant.id, { ...pagination, warehouseId, materialTypeId });
  return ApiResponse.paginated(res, result.inventory, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getAllLots = asyncHandler(async (req, res) => {
  const { page, pageSize, status, warehouseId, jobId } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await inventoryService.getAllLots(req.tenant.id, { ...pagination, status, warehouseId, jobId });
  return ApiResponse.paginated(res, result.lots, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getLotById = asyncHandler(async (req, res) => {
  const lot = await inventoryService.getLotById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, lot);
});

const createLot = asyncHandler(async (req, res) => {
  const lot = await inventoryService.createLot(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, lot, 'Lot created successfully');
});

const updateLot = asyncHandler(async (req, res) => {
  const lot = await inventoryService.updateLot(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, lot, 'Lot updated successfully');
});

const adjustLotQuantity = asyncHandler(async (req, res) => {
  const lot = await inventoryService.adjustLotQuantity(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, lot, 'Lot quantity adjusted');
});

const closeLot = asyncHandler(async (req, res) => {
  const lot = await inventoryService.closeLot(req.tenant.id, req.params.id, req.user.id);
  return ApiResponse.success(res, lot, 'Lot closed successfully');
});

const getStockMovements = asyncHandler(async (req, res) => {
  const { page, pageSize, lotId, warehouseId, transactionType, startDate, endDate } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await inventoryService.getStockMovements(req.tenant.id, { ...pagination, lotId, warehouseId, transactionType, startDate, endDate });
  return ApiResponse.paginated(res, result.movements, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getInventoryValuation = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  const result = await inventoryService.getInventoryValuation(req.tenant.id, { warehouseId });
  return ApiResponse.success(res, result);
});

module.exports = {
  getAllInventory,
  getAllLots,
  getLotById,
  createLot,
  updateLot,
  adjustLotQuantity,
  closeLot,
  getStockMovements,
  getInventoryValuation,
};
