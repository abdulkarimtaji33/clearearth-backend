const express = require('express');
const router = express.Router();
const grnController = require('../controllers/grn.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

router.get('/', authorize('grn.read'), grnController.list);
router.get('/:id', authorize('grn.read'), grnController.getById);
router.post('/', authorize('grn.create'), grnController.create);
router.patch('/:id', authorize('grn.update'), grnController.update);
router.post('/:id/images', authorize('grn.update'), uploadMultiple('images', 20), grnController.uploadImages);
router.post('/:id/approve', authorize('grn.update'), grnController.approve);

module.exports = router;
