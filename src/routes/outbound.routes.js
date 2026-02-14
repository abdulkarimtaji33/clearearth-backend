const express = require('express');
const router = express.Router();
const outboundController = require('../controllers/outbound.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('outbound.read'), outboundController.getAllOutbound);
router.get('/:id', authorize('outbound.read'), outboundController.getOutboundById);
router.post('/', authorize('outbound.create'), outboundController.createOutbound);
router.post('/:id/dispatch', authorize('outbound.approve'), outboundController.confirmDispatch);
router.post('/:id/delivery', authorize('outbound.update'), outboundController.completeDelivery);

module.exports = router;
