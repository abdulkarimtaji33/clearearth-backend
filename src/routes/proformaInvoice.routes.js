const express = require('express');
const router = express.Router();
const proformaInvoiceController = require('../controllers/proformaInvoice.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get(
  '/preview-from-quotation/:quotationId',
  authorize('deals.read'),
  proformaInvoiceController.previewFromQuotation
);
router.get('/', authorize('deals.read'), proformaInvoiceController.getAll);
router.get('/:id', authorize('deals.read'), proformaInvoiceController.getById);
router.post('/', authorize('deals.create'), proformaInvoiceController.create);
router.put('/:id', authorize('deals.update'), proformaInvoiceController.update);
router.delete('/:id', authorize('deals.delete'), proformaInvoiceController.remove);

module.exports = router;
