const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

// Access to the driver app is the `driver.app` permission (editable per role in the Roles UI)
router.get('/pickups', authorize('driver.app'), driverController.listPickups);
router.get('/pickups/:taskId', authorize('driver.app'), driverController.getPickup);
router.put('/pickups/:taskId/note', authorize('driver.app'), driverController.savePickupNote);
router.post('/pickups/:taskId/start', authorize('driver.app'), driverController.startPickup);
router.post(
  '/pickups/:taskId/complete',
  authorize('driver.app'),
  uploadMultiple('photos', 20),
  driverController.markPickedUp
);

module.exports = router;
