const express = require('express');
const router = express.Router();
const payablesController = require('../controllers/payables.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/aging-summary', authorize('accounting.read', 'deals.read'), payablesController.agingSummary);
router.get('/', authorize('accounting.read', 'deals.read'), payablesController.list);
router.post('/:id/payment', authorize('accounting.update'), payablesController.recordPayment);

module.exports = router;
