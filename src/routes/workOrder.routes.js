const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('deals.read'), workOrderController.getAll);
router.get('/:id', authorize('deals.read'), workOrderController.getById);
router.post('/', authorize('deals.create'), workOrderController.create);
router.put('/:id', authorize('deals.update'), workOrderController.update);
router.patch('/:id/tasks/:taskId/status', authorize('deals.update'), workOrderController.updateTaskStatus);
router.delete('/:id', authorize('deals.delete'), workOrderController.remove);

module.exports = router;
