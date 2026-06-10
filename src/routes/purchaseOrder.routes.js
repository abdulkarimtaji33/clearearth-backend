const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

router.get('/', purchaseOrderController.getAll);
router.get('/:id', purchaseOrderController.getById);
router.post('/', purchaseOrderController.create);
router.put('/:id', purchaseOrderController.update);
router.post('/:id/approve', authorize('purchase_orders.approve'), purchaseOrderController.approve);
router.post('/:id/request-approval', authorize('purchase_orders.update'), purchaseOrderController.requestApproval);
router.post('/:id/approve-with-pin', authorize('purchase_orders.update'), [
  param('id').isInt().withMessage('Valid purchase order ID is required'),
  body('pin').notEmpty().withMessage('Approval PIN is required'),
  validate,
], purchaseOrderController.approveWithPin);
router.delete('/:id', purchaseOrderController.remove);

module.exports = router;
