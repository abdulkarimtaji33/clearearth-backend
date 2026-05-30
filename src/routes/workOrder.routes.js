const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('operations.read', 'deals.read'), workOrderController.getAll);
router.get('/:id', authorize('operations.read', 'deals.read'), workOrderController.getById);
router.post('/', authorize('operations.create', 'deals.create'), workOrderController.create);
router.put('/:id', authorize('operations.update', 'deals.update'), workOrderController.update);
router.patch('/:id/tasks/:taskId/status', authorize('operations.update', 'deals.update'), workOrderController.updateTaskStatus);
router.patch('/:id/tasks/:taskId/notes', authorize('operations.update', 'deals.update'), workOrderController.updateTaskNotes);
router.patch('/:id/tasks/:taskId/assign', authorize('operations.update', 'deals.update'), workOrderController.updateTaskAssignment);
router.delete('/:id', authorize('operations.delete', 'deals.delete'), workOrderController.remove);

module.exports = router;
