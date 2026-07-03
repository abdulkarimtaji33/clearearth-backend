const express = require('express');
const router = express.Router();
const proformaInvoiceController = require('../controllers/proformaInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-quotation/:quotationId',
  authorize('proforma_invoices.read.own', 'proforma_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'),
  proformaInvoiceController.previewFromQuotation
);
router.get('/', authorize('proforma_invoices.read.own', 'proforma_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'), proformaInvoiceController.getAll);
router.get('/:id', authorize('proforma_invoices.read.own', 'proforma_invoices.read.all', 'accounting.read', 'deals.read.own', 'deals.read.all'), proformaInvoiceController.getById);
router.post('/', authorize('proforma_invoices.create', 'accounting.create', 'deals.create'), proformaInvoiceController.create);
router.put('/:id', authorize('proforma_invoices.update.own', 'proforma_invoices.update.all', 'accounting.update', 'deals.update.own', 'deals.update.all'), proformaInvoiceController.update);
router.delete('/:id', authorize('proforma_invoices.delete.own', 'proforma_invoices.delete.all', 'accounting.delete', 'deals.delete.own', 'deals.delete.all'), proformaInvoiceController.remove);

module.exports = router;
