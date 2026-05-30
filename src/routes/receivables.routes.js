const express = require('express');
const router = express.Router();
const receivablesController = require('../controllers/receivables.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/aging-summary', authorize('accounting.read', 'deals.read'), receivablesController.agingSummary);
router.get('/', authorize('accounting.read', 'deals.read'), receivablesController.list);
router.get('/:id/payments', authorize('accounting.read', 'deals.read'), receivablesController.listPayments);
router.post('/:id/payment', authorize('accounting.update'), receivablesController.recordPayment);

module.exports = router;
