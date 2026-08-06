/**
 * Tenant Routes - Company/organization settings (current user's tenant)
 */
const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body } = require('express-validator');
const { phoneValidator } = require('../utils/phone');

const updateTenantValidation = [
  body('phone').optional({ values: 'falsy' }).custom(phoneValidator({ label: 'Phone number' })),
  validate,
];

// Public — no auth
router.get('/logo', tenantController.getPublicLogo);

router.use(authenticate);

router.get('/me', tenantController.getMyTenant);
router.put('/me', authorize('users.update'), updateTenantValidation, tenantController.updateMyTenant);
router.put('/me/lead-approval-pin', authorize('users.update'), tenantController.updateLeadApprovalPin);

module.exports = router;
