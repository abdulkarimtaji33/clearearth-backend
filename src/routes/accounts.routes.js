const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/expenses', authorize('accounting.read', 'deals.read'), accountsController.listExpenses);
router.post('/expenses', authorize('accounting.update'), accountsController.createExpense);
router.get('/expenses/:id/payments', authorize('accounting.read', 'deals.read'), accountsController.listExpensePayments);
router.patch('/expenses/:id/payment', authorize('accounting.update'), accountsController.updateExpensePayment);
router.get('/work-orders', authorize('accounting.read', 'deals.read'), accountsController.listWorkOrders);
router.get('/work-orders/:id', authorize('accounting.read', 'deals.read'), accountsController.getWorkOrder);
router.post(
  '/work-orders/:workOrderId/task-expenses/:taskExpenseId/approve',
  authorize('accounting.update'),
  accountsController.approveTaskExpense
);
router.post(
  '/work-orders/:workOrderId/task-expenses/:taskExpenseId/reject',
  authorize('accounting.update'),
  accountsController.rejectTaskExpense
);

module.exports = router;
