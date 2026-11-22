const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/register.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
// purchase / service / sales: read-only registers of orders and invoices
router.get('/:kind', authorize('outbound.read', 'grn.read', 'purchase_orders.read', 'quotations.read'), ctrl.list);

module.exports = router;
