const express = require('express');
const router = express.Router();
const receivablesController = require('../controllers/receivables.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/aging-summary', authorize('deals.read'), receivablesController.agingSummary);
router.get('/', authorize('deals.read'), receivablesController.list);
router.post('/:id/payment', authorize('deals.update'), receivablesController.recordPayment);

module.exports = router;
