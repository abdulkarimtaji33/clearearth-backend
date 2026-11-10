const express = require('express');
const router = express.Router();
const creditNoteController = require('../controllers/creditNote.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/invoice/:taxInvoiceId/info', authorize('accounting.read', 'deals.read'), creditNoteController.invoiceInfo);
router.get('/', authorize('accounting.read', 'deals.read'), creditNoteController.list);
router.get('/:id', authorize('accounting.read', 'deals.read'), creditNoteController.getById);
router.post('/', authorize('accounting.create'), creditNoteController.create);

module.exports = router;
