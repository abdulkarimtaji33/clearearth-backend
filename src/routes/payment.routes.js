const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('payments.read'), paymentController.getAll);
router.get('/cheques/postdated', authorize('payments.read'), paymentController.getPostDatedCheques);
router.get('/:id', authorize('payments.read'), paymentController.getById);
router.post('/', authorize('payments.create'), paymentController.create);
router.post('/cheques/:chequeId/status', authorize('payments.update'), paymentController.updateChequeStatus);
router.delete('/:id', authorize('payments.delete'), paymentController.remove);

module.exports = router;
