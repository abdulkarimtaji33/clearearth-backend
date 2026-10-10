const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

router.get('/', authorize('operations.read', 'deals.read'), workOrderController.getAll);
router.get('/:id', authorize('operations.read', 'deals.read'), workOrderController.getById);
router.post('/', authorize('operations.create'), workOrderController.create);
router.put('/:id', authorize('operations.update', 'deals.update'), workOrderController.update);
router.patch('/:id/tasks/:taskId/status', authorize('operations.update', 'deals.update'), workOrderController.updateTaskStatus);
router.patch('/:id/tasks/:taskId/notes', authorize('operations.update', 'deals.update'), workOrderController.updateTaskNotes);
router.patch('/:id/tasks/:taskId/assign', authorize('operations.update', 'deals.update'), workOrderController.updateTaskAssignment);

// Task completion evidence — any document/image type the shared upload allowlist accepts.
router.get('/:id/tasks/:taskId/files', authorize('operations.read', 'deals.read'), workOrderController.listTaskFiles);
router.post('/:id/tasks/:taskId/files', authorize('operations.update', 'deals.update'), uploadMultiple('files', 20), workOrderController.uploadTaskFiles);
router.delete('/:id/tasks/:taskId/files/:fileId', authorize('operations.update', 'deals.update'), workOrderController.deleteTaskFile);
router.post('/:id/tasks/:taskId/files/:fileId/link-certificate', authorize('operations.update', 'certificates.create'), workOrderController.linkTaskFileToCertificate);

router.delete('/:id', authorize('operations.delete', 'deals.delete'), workOrderController.remove);

module.exports = router;
