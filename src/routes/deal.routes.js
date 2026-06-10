/**
 * Deal Routes
 */
const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// Deal CRUD
router.get('/', authorize('deals.read'), dealController.getAll);
router.get('/:id', authorize('deals.read'), dealController.getById);
router.post('/', authorize('deals.create'), dealController.create);
router.put('/:id', authorize('deals.update'), dealController.update);
router.post('/:id/approve', authorize('deals.approve'), dealController.approve);
router.post('/:id/request-approval', authorize('deals.update'), dealController.requestApproval);
router.post('/:id/approve-with-pin', authorize('deals.update'), [
  param('id').isInt().withMessage('Valid deal ID is required'),
  body('pin').notEmpty().withMessage('Approval PIN is required'),
  validate,
], dealController.approveWithPin);
router.patch('/:id/collection-details', authorize('deals.update', 'operations.update'), dealController.updateCollectionDetails);
router.delete('/:id', authorize('deals.delete'), dealController.remove);

// Payment tracking
router.post('/:id/payment', authorize('deals.update'), dealController.updatePayment);

// Inspection report - deals.read OR inspection_reports.create/update (for inspection team)
router.put('/:id/inspection-report', authorize('deals.read', 'inspection_reports.create', 'inspection_reports.update'), dealController.saveInspectionReport);

module.exports = router;
