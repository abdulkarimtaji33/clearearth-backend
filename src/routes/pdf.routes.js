/**
 * PDF Routes - Quotation and Purchase Order PDF downloads
 */
const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate } = require('../middlewares/auth');

// Apply authenticate per-route so we don't block public routes (e.g. /auth/login)
router.get('/quotations/:id/pdf', authenticate, quotationController.getPdf);
router.get('/purchase-orders/:id/pdf', authenticate, purchaseOrderController.getPdf);

module.exports = router;
