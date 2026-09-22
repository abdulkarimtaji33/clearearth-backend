const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/', purchaseOrderController.getAll);
router.get('/:id', purchaseOrderController.getById);
router.post('/', purchaseOrderController.create);
router.put('/:id', purchaseOrderController.update);
router.post('/:id/approve', authorize('purchase_orders.approve'), [
  body('requestedPickupDate').optional({ nullable: true }).isISO8601().withMessage('Requested pickup date must be a valid date'),
  validate,
], purchaseOrderController.approve);
router.post('/:id/request-approval', authorize('purchase_orders.update'), [
  body('requestedPickupDate').optional({ nullable: true }).isISO8601().withMessage('Requested pickup date must be a valid date'),
  validate,
], purchaseOrderController.requestApproval);
router.post('/:id/confirm-pickup-date', authorize('operations.update', 'operations.read'), purchaseOrderController.confirmPickupDate);
router.post('/:id/request-pickup-reschedule', authorize('operations.update', 'operations.read'), [
  body('note').optional({ nullable: true }).isString(),
  validate,
], purchaseOrderController.requestPickupReschedule);
router.post('/:id/reschedule-pickup-date', authorize('purchase_orders.update'), [
  body('pickupDate').isISO8601().withMessage('Pickup date must be a valid date'),
  validate,
], purchaseOrderController.reschedulePickupDate);
router.delete('/:id', purchaseOrderController.remove);

module.exports = router;
