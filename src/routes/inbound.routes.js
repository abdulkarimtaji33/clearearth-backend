const express = require('express');
const router = express.Router();
const inboundController = require('../controllers/inbound.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/grn', authorize('inbound.read'), inboundController.getAllGRNs);
router.get('/grn/:id', authorize('inbound.read'), inboundController.getGRNById);
router.post('/grn', authorize('inbound.create'), inboundController.createGRN);
router.post('/grn/:id/approve', authorize('inbound.approve'), inboundController.approveGRN);
router.post('/grn/:id/reject', authorize('inbound.approve'), inboundController.rejectGRN);

module.exports = router;
