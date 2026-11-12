const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierDebitNote.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/bill/:vendorBillId/info', authorize('accounting.read'), ctrl.billInfo);
router.get('/', authorize('accounting.read'), ctrl.list);
router.get('/:id', authorize('accounting.read'), ctrl.getById);
router.post('/', authorize('accounting.create'), ctrl.create);

module.exports = router;
