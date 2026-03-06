/**
 * Tenant Routes - Company/organization settings (current user's tenant)
 */
const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/me', tenantController.getMyTenant);
router.put('/me', authorize('users.read', 'users.update'), tenantController.updateMyTenant);

module.exports = router;
