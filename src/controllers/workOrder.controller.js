/**
 * Work Order Controller
 */
const workOrderService = require('../services/workOrder.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dealId, status } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await workOrderService.getAll(req.tenant.id, {
    ...pagination,
    search,
    dealId,
    status,
  });
  return ApiResponse.paginated(res, result.workOrders, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const getById = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, workOrder);
});

const create = asyncHandler(async (req, res) => {
  const scope = { userId: req.user?.id };
  const workOrder = await workOrderService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, workOrder, 'Work order created successfully');
});

const update = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, workOrder, 'Work order updated successfully');
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await workOrderService.updateTaskStatus(req.tenant.id, req.params.id, req.params.taskId, status);
  return ApiResponse.success(res, task, 'Task status updated');
});

const remove = asyncHandler(async (req, res) => {
  await workOrderService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Work order deleted successfully');
});

module.exports = { getAll, getById, create, update, updateTaskStatus, remove };
