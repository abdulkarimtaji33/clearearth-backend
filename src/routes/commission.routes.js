const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commission.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Admin — commission rate settings (reuses the users.update permission, same as other admin-only user actions)
router.put('/settings/:userId', authorize('users.update'), commissionController.setRate);
router.get('/settings', authorize('users.update'), commissionController.getSettings);

// Any authenticated user — their own commission history
router.get('/me', commissionController.getMine);

// Admin — all commissions, filterable
router.get('/', authorize('users.update'), commissionController.getAll);

// Admin/accounts — mark a commission as paid
router.post('/:id/pay', authorize('users.update'), commissionController.pay);

module.exports = router;
