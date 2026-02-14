const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/deals', authorize('reports.read'), reportController.getDealReport);
router.get('/invoices', authorize('reports.read'), reportController.getInvoiceReport);
router.get('/inventory', authorize('reports.read'), reportController.getInventoryReport);
router.get('/sales', authorize('reports.read'), reportController.getSalesReport);
router.get('/vat', authorize('reports.read'), reportController.getVATReport);
router.get('/customer-ageing', authorize('reports.read'), reportController.getCustomerAgeingReport);
router.get('/commissions', authorize('reports.read'), reportController.getCommissionReport);
router.get('/expenses', authorize('reports.read'), reportController.getExpenseReport);

module.exports = router;
