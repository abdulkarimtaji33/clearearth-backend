const express = require('express');
const router = express.Router();
const taxInvoiceController = require('../controllers/taxInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-proforma/:proformaInvoiceId',
  authorize('deals.read'),
  taxInvoiceController.previewFromProforma
);
router.get('/', authorize('deals.read'), taxInvoiceController.getAll);
router.get('/:id', authorize('deals.read'), taxInvoiceController.getById);
router.post('/', authorize('deals.create'), taxInvoiceController.create);
router.put('/:id', authorize('deals.update'), taxInvoiceController.update);
router.delete('/:id', authorize('deals.delete'), taxInvoiceController.remove);

module.exports = router;
