const express = require('express');
const router = express.Router();
const vendorBillController = require('../controllers/vendorBill.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/awaiting-bill', authorize('accounting.read', 'deals.read'), vendorBillController.awaitingBill);
router.get('/', authorize('accounting.read', 'deals.read'), vendorBillController.list);
router.get('/:id', authorize('accounting.read', 'deals.read'), vendorBillController.getById);
router.post('/', authorize('accounting.create'), vendorBillController.create);
router.post('/direct', authorize('accounting.create'), vendorBillController.createDirect);
router.post('/pay', authorize('accounting.update'), vendorBillController.pay);

module.exports = router;
