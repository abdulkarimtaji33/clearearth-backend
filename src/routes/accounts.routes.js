const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/expenses', authorize('deals.read'), accountsController.listExpenses);
router.post('/expenses', authorize('deals.update'), accountsController.createExpense);
router.patch('/expenses/:id/payment', authorize('deals.update'), accountsController.updateExpensePayment);
router.get('/work-orders', authorize('deals.read'), accountsController.listWorkOrders);
router.get('/work-orders/:id', authorize('deals.read'), accountsController.getWorkOrder);
router.post(
  '/work-orders/:workOrderId/task-expenses/:taskExpenseId/approve',
  authorize('deals.update'),
  accountsController.approveTaskExpense
);
router.post(
  '/work-orders/:workOrderId/task-expenses/:taskExpenseId/reject',
  authorize('deals.update'),
  accountsController.rejectTaskExpense
);

module.exports = router;
