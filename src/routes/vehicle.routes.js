const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('vehicles.read'), vehicleController.getAll);
router.get('/:id', authorize('vehicles.read'), vehicleController.getById);
router.post('/', authorize('vehicles.create'), vehicleController.create);
router.put('/:id', authorize('vehicles.update'), vehicleController.update);
router.post('/:id/status', authorize('vehicles.update'), vehicleController.updateStatus);
router.post('/:id/fuel', authorize('vehicles.update'), vehicleController.addFuelLog);
router.post('/:id/maintenance', authorize('vehicles.update'), vehicleController.addMaintenanceLog);
router.delete('/:id', authorize('vehicles.delete'), vehicleController.remove);

module.exports = router;
