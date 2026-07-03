const express = require('express');
const router = express.Router();
const taxInvoiceController = require('../controllers/taxInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-proforma/:proformaInvoiceId',
  authorize('tax_invoices.read.own', 'tax_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'),
  taxInvoiceController.previewFromProforma
);
router.get('/', authorize('tax_invoices.read.own', 'tax_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'), taxInvoiceController.getAll);
router.get('/:id', authorize('tax_invoices.read.own', 'tax_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'), taxInvoiceController.getById);
router.post('/', authorize('tax_invoices.create', 'accounting.create', 'deals.create'), taxInvoiceController.create);
router.put('/:id', authorize('tax_invoices.update.own', 'tax_invoices.update.all', 'accounting.update', 'deals.update.own', 'deals.update.all'), taxInvoiceController.update);
router.delete('/:id', authorize('tax_invoices.delete.own', 'tax_invoices.delete.all', 'accounting.delete', 'deals.delete.own', 'deals.delete.all'), taxInvoiceController.remove);

module.exports = router;
