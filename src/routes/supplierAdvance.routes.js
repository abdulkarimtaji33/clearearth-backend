const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierAdvance.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/supplier/:supplierId/apply-options', authorize('accounting.read'), ctrl.applyOptions);
router.get('/', authorize('accounting.read'), ctrl.list);
router.get('/:id', authorize('accounting.read'), ctrl.getById);
router.post('/', authorize('accounting.create'), ctrl.create);
router.post('/:id/apply', authorize('accounting.create'), ctrl.apply);

module.exports = router;
