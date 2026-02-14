const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');

router.use(authenticate);

router.get('/', authorize('documents.read'), documentController.getAll);
router.get('/:id', authorize('documents.read'), documentController.getById);
router.post('/', authorize('documents.create'), uploadSingle('file'), documentController.create);
router.post('/:id/version', authorize('documents.create'), uploadSingle('file'), documentController.createVersion);
router.put('/:id', authorize('documents.update'), documentController.update);
router.post('/:id/deactivate', authorize('documents.update'), documentController.deactivate);
router.delete('/:id', authorize('documents.delete'), documentController.remove);

module.exports = router;
