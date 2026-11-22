const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commission.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Admin — commission rate settings (commissions.manage permission)
router.put('/settings/:userId', authorize('commissions.manage'), commissionController.setRate);
router.get('/settings', authorize('commissions.manage'), commissionController.getSettings);

// Any authenticated user — their own commission history
router.get('/me', commissionController.getMine);

// Admin — all commissions, filterable
router.get('/', authorize('commissions.manage'), commissionController.getAll);

// Admin/accounts — mark a commission as paid
router.post('/:id/pay', authorize('commissions.manage'), commissionController.pay);

module.exports = router;
