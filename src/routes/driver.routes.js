const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

router.use(authenticate);

const ALLOWED_ROLES = ['driver', 'admin', 'tenant_admin', 'operations_manager'];

router.get('/pickups', authorizeRole(...ALLOWED_ROLES), driverController.listPickups);
router.get('/pickups/:taskId', authorizeRole(...ALLOWED_ROLES), driverController.getPickup);
router.post('/pickups/:taskId/start', authorizeRole(...ALLOWED_ROLES), driverController.startPickup);
router.post(
  '/pickups/:taskId/complete',
  authorizeRole(...ALLOWED_ROLES),
  uploadMultiple('photos', 20),
  driverController.markPickedUp
);

module.exports = router;
