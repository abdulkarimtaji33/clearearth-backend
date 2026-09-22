const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/', quotationController.getAll);
router.get('/:id', quotationController.getById);
router.post('/', quotationController.create);
router.put('/:id', quotationController.update);
router.post('/:id/approve', authorize('quotations.approve'), [
  body('requestedPickupDate').optional({ nullable: true }).isISO8601().withMessage('Requested pickup date must be a valid date'),
  validate,
], quotationController.approve);
router.post('/:id/request-approval', authorize('quotations.update'), [
  body('requestedPickupDate').optional({ nullable: true }).isISO8601().withMessage('Requested pickup date must be a valid date'),
  validate,
], quotationController.requestApproval);
router.post('/:id/confirm-pickup-date', authorize('operations.update', 'operations.read'), quotationController.confirmPickupDate);
router.post('/:id/request-pickup-reschedule', authorize('operations.update', 'operations.read'), [
  body('note').optional({ nullable: true }).isString(),
  validate,
], quotationController.requestPickupReschedule);
router.post('/:id/reschedule-pickup-date', authorize('quotations.update'), [
  body('pickupDate').isISO8601().withMessage('Pickup date must be a valid date'),
  validate,
], quotationController.reschedulePickupDate);
router.delete('/:id', quotationController.remove);

module.exports = router;
