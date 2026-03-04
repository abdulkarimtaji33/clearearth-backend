const express = require('express');
const router = express.Router();
const inspectionRequestController = require('../controllers/inspectionRequest.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('inspection_requests.read'), inspectionRequestController.getAll);
router.get('/:id', authorize('inspection_requests.read'), inspectionRequestController.getById);

module.exports = router;
