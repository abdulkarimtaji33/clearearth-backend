const express = require('express');
const router = express.Router();
const inspectionRequestController = require('../controllers/inspectionRequest.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('inspection_requests.read'), inspectionRequestController.getAll);
router.get('/:id', authorize('inspection_requests.read'), inspectionRequestController.getById);
router.patch('/:id/status', authorize('inspection_requests.update'), inspectionRequestController.updateStatus);
router.patch('/:id/priority', authorize('inspection_requests.update'), inspectionRequestController.updatePriority);
router.post('/:id/accept', authorize('inspection_requests.update'), inspectionRequestController.acceptRequest);
router.post('/:id/reject', authorize('inspection_requests.update'), inspectionRequestController.rejectRequest);

module.exports = router;
