const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('warehouses.read'), warehouseController.getAll);
router.get('/:id', authorize('warehouses.read'), warehouseController.getById);
router.post('/', authorize('warehouses.create'), warehouseController.create);
router.put('/:id', authorize('warehouses.update'), warehouseController.update);
router.post('/:id/deactivate', authorize('warehouses.update'), warehouseController.deactivate);
router.post('/:id/activate', authorize('warehouses.update'), warehouseController.activate);
router.delete('/:id', authorize('warehouses.delete'), warehouseController.remove);

module.exports = router;
