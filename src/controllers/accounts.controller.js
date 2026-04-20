const workOrderService = require('../services/workOrder.service');
const expenseService = require('../services/expense.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const listWorkOrders = asyncHandler(async (req, res) => {
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

const getWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await workOrderService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, workOrder);
});

const listExpenses = asyncHandler(async (req, res) => {
  const { page, pageSize, search, dateFrom, dateTo, category } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await expenseService.listLedgerExpenses(req.tenant.id, {
    ...pagination,
    search,
    dateFrom,
    dateTo,
    category,
  });
  return ApiResponse.paginated(res, result.expenses, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: result.total,
  });
});

const createExpense = asyncHandler(async (req, res) => {
  const row = await expenseService.createManualExpense(req.tenant.id, req.user.id, req.body);
  return ApiResponse.created(res, row, 'Expense recorded');
});

const approveTaskExpense = asyncHandler(async (req, res) => {
  const wo = await expenseService.approveTaskExpense(
    req.tenant.id,
    req.user.id,
    req.params.workOrderId,
    req.params.taskExpenseId,
    req.body
  );
  return ApiResponse.success(res, wo, 'Expense approved and recorded');
});

const rejectTaskExpense = asyncHandler(async (req, res) => {
  const wo = await expenseService.rejectTaskExpense(
    req.tenant.id,
    req.params.workOrderId,
    req.params.taskExpenseId
  );
  return ApiResponse.success(res, wo, 'Expense rejected');
});

module.exports = {
  listWorkOrders,
  getWorkOrder,
  listExpenses,
  createExpense,
  approveTaskExpense,
  rejectTaskExpense,
};
