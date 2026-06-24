/**
 * Work Order Controller
 */
const workOrderService = require('../services/workOrder.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { shouldHideDealFinancials, sanitizeDealPayload } = require('../utils/dealFinancials');

const sanitizeWorkOrderDeal = (workOrder, hideFinancials) => {
  if (!hideFinancials || !workOrder) return workOrder;
  const plain = workOrder.get ? workOrder.get({ plain: true }) : { ...workOrder };
  if (plain.deal) plain.deal = sanitizeDealPayload(plain.deal, true);
  return plain;
};

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
  const hideFinancials = shouldHideDealFinancials(req.user?.role?.name);
  return ApiResponse.success(res, sanitizeWorkOrderDeal(workOrder, hideFinancials));
});

const create = asyncHandler(async (req, res) => {
  const roleName = req.user?.role?.name || req.user?.Role?.name;
  if (['sales', 'sales_manager'].includes(roleName)) {
    const ApiError = require('../utils/apiError');
    throw ApiError.forbidden('Sales users cannot create work orders');
  }
  const scope = { userId: req.user?.id };
  const workOrder = await workOrderService.create(req.tenant.id, req.body, scope);
  return ApiResponse.created(res, workOrder, 'Work order created successfully');
});

const update = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.update(req.tenant.id, req.params.id, { ...req.body, _actorUser: req.user });
  return ApiResponse.success(res, workOrder, 'Work order updated successfully');
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await workOrderService.updateTaskStatus(req.tenant.id, req.params.id, req.params.taskId, status);
  return ApiResponse.success(res, task, 'Task status updated');
});

const updateTaskNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const task = await workOrderService.updateTaskNotes(req.tenant.id, req.params.id, req.params.taskId, notes);
  return ApiResponse.success(res, task, 'Task notes updated');
});

const updateTaskAssignment = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const task = await workOrderService.updateTaskAssignment(req.tenant.id, req.params.id, req.params.taskId, assignedTo);
  return ApiResponse.success(res, task, 'Task assignment updated');
});

const remove = asyncHandler(async (req, res) => {
  await workOrderService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Work order deleted successfully');
});

module.exports = { getAll, getById, create, update, updateTaskStatus, updateTaskNotes, updateTaskAssignment, remove };
