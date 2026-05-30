const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth');

router.use(authenticate);

router.get('/pickups', authorizeRole('driver', 'admin', 'tenant_admin', 'operations_manager'), driverController.listPickups);
router.post('/pickups/:taskId/complete', authorizeRole('driver', 'admin', 'tenant_admin', 'operations_manager'), driverController.markPickedUp);

module.exports = router;
