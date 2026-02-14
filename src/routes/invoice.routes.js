const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('invoices.read'), invoiceController.getAll);
router.get('/statistics', authorize('invoices.read'), invoiceController.getStatistics);
router.get('/:id', authorize('invoices.read'), invoiceController.getById);
router.post('/', authorize('invoices.create'), invoiceController.create);
router.put('/:id', authorize('invoices.update'), invoiceController.update);
router.post('/:id/approve', authorize('invoices.approve'), invoiceController.approve);
router.post('/:id/payment', authorize('invoices.update'), invoiceController.recordPayment);
router.post('/:id/cancel', authorize('invoices.update'), invoiceController.cancel);
router.delete('/:id', authorize('invoices.delete'), invoiceController.remove);

module.exports = router;
