const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commission.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('commissions.read'), commissionController.getAll);
router.get('/summary', authorize('commissions.read'), commissionController.getSummary);
router.post('/calculate', authorize('commissions.create'), commissionController.calculateCommission);
router.get('/:id', authorize('commissions.read'), commissionController.getById);
router.post('/', authorize('commissions.create'), commissionController.create);
router.post('/:id/approve', authorize('commissions.approve'), commissionController.approve);
router.post('/:id/payment', authorize('commissions.approve'), commissionController.processPayment);
router.post('/:id/reverse', authorize('commissions.approve'), commissionController.reverseCommission);

module.exports = router;
