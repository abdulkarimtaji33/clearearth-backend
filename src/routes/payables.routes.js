const express = require('express');
const router = express.Router();
const payablesController = require('../controllers/payables.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/payment-receipts', authorize('accounting.read', 'deals.read'), payablesController.listPaymentReceipts);
router.get('/payment-receipts/:paymentId', authorize('accounting.read', 'deals.read'), payablesController.getPaymentReceipt);
router.get('/aging-summary', authorize('accounting.read', 'deals.read'), payablesController.agingSummary);
router.get('/', authorize('accounting.read', 'deals.read'), payablesController.list);
router.get('/:id/payments', authorize('accounting.read', 'deals.read'), payablesController.listPayments);
router.post('/:id/payment', authorize('accounting.update'), payablesController.recordPayment);

module.exports = router;
