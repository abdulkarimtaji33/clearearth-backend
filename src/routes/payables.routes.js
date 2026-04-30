const express = require('express');
const router = express.Router();
const payablesController = require('../controllers/payables.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/aging-summary', authorize('deals.read'), payablesController.agingSummary);
router.get('/', authorize('deals.read'), payablesController.list);
router.post('/:id/payment', authorize('deals.update'), payablesController.recordPayment);

module.exports = router;
