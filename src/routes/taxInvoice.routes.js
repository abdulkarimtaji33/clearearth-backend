const express = require('express');
const router = express.Router();
const taxInvoiceController = require('../controllers/taxInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-proforma/:proformaInvoiceId',
  authorize('accounting.read', 'deals.read'),
  taxInvoiceController.previewFromProforma
);
router.get('/', authorize('accounting.read', 'deals.read'), taxInvoiceController.getAll);
router.get('/:id/pdf', authorize('accounting.read', 'deals.read'), taxInvoiceController.getPdf);
router.get('/:id', authorize('accounting.read', 'deals.read'), taxInvoiceController.getById);
router.post('/', authorize('accounting.create', 'deals.create'), taxInvoiceController.create);
router.put('/:id', authorize('accounting.update', 'deals.update'), taxInvoiceController.update);
router.delete('/:id', authorize('accounting.delete', 'deals.delete'), taxInvoiceController.remove);

module.exports = router;
