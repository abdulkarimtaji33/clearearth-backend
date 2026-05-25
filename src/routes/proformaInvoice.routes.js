const express = require('express');
const router = express.Router();
const proformaInvoiceController = require('../controllers/proformaInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-quotation/:quotationId',
  authorize('accounting.read', 'deals.read'),
  proformaInvoiceController.previewFromQuotation
);
router.get('/', authorize('accounting.read', 'deals.read'), proformaInvoiceController.getAll);
router.get('/:id', authorize('accounting.read', 'deals.read'), proformaInvoiceController.getById);
router.post('/', authorize('accounting.create', 'deals.create'), proformaInvoiceController.create);
router.put('/:id', authorize('accounting.update', 'deals.update'), proformaInvoiceController.update);
router.delete('/:id', authorize('accounting.delete', 'deals.delete'), proformaInvoiceController.remove);

module.exports = router;
