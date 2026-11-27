const express = require('express');
const router = express.Router();
const controller = require('../controllers/warehouse.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/meta', authorize('grn.read'), controller.meta);
router.get('/summary', authorize('grn.read'), controller.summary);
router.get('/tags', authorize('grn.read'), controller.tags);
router.post('/tags', authorize('grn.update'), controller.createTag);
router.get('/scan', authorize('grn.read'), controller.scan);
router.get('/batches', authorize('grn.read'), controller.list);
router.get('/batches/:id', authorize('grn.read'), controller.getById);
router.get('/batches/:id/qr', authorize('grn.read'), controller.qr);
router.post('/batches/:id/tags', authorize('grn.update'), controller.addTag);
router.delete('/batches/:id/tags/:tagId', authorize('grn.update'), controller.removeTag);
router.post('/batches/:id/actions', authorize('grn.update'), controller.action);
router.post('/batches/:id/split', authorize('grn.update'), controller.split);

module.exports = router;
