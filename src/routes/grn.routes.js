const express = require('express');
const router = express.Router();
const grnController = require('../controllers/grn.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

router.get('/', authorize('grn.read'), grnController.list);
// Must come before '/:id' so 'inventory' isn't matched as a GRN id.
router.get('/inventory', authorize('grn.read'), grnController.listInventory);
router.get('/inventory/stock', authorize('grn.read'), grnController.stockOnHand);
router.get('/:id', authorize('grn.read'), grnController.getById);
router.get('/:id/pdf', authorize('grn.read'), grnController.getPdf);
router.post('/', authorize('grn.create'), grnController.create);
router.patch('/:id', authorize('grn.update'), grnController.update);
router.post('/:id/items/:itemId/images', authorize('grn.update'), uploadMultiple('images', 20), grnController.uploadItemImages);
router.post('/:id/approve', authorize('grn.update'), grnController.approve);

module.exports = router;
