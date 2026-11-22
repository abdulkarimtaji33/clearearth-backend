const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/outbound.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Outbound entries are created automatically with each GRN, so there is no POST /: they are only edited.
router.get('/', authorize('outbound.read'), ctrl.list);
router.get('/:id', authorize('outbound.read'), ctrl.getById);
router.get('/:id/gatepass', authorize('outbound.read'), ctrl.getPdf);
router.patch('/:id', authorize('outbound.update'), ctrl.update);
router.post('/:id/delivery-request', authorize('outbound.schedule'), ctrl.requestDelivery);
router.post('/:id/confirm-delivery', authorize('outbound.update', 'outbound.schedule'), ctrl.confirmDelivery);
router.post('/:id/request-reschedule', authorize('outbound.update'), ctrl.requestReschedule);

module.exports = router;
