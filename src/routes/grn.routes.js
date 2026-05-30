const express = require('express');
const router = express.Router();
const grnController = require('../controllers/grn.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

router.get('/', authorize('operations.read', 'deals.read'), grnController.list);
router.get('/:id', authorize('operations.read', 'deals.read'), grnController.getById);
router.post('/', authorize('operations.create', 'deals.create'), grnController.create);
router.patch('/:id', authorize('operations.update', 'deals.update'), grnController.update);
router.post('/:id/images', authorize('operations.update', 'deals.update'), uploadMultiple('images', 20), grnController.uploadImages);
router.post('/:id/approve', authorize('operations.update', 'deals.update'), grnController.approve);

module.exports = router;
