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
router.get('/', authorize('deals.read.own', 'deals.read.all'), dealController.getAll);
router.get('/:id', authorize('deals.read.own', 'deals.read.all'), dealController.getById);
router.post('/', authorize('deals.create'), dealController.create);
router.put('/:id', authorize('deals.update.own', 'deals.update.all'), dealController.update);
router.post('/:id/approve', authorize('deals.approve'), dealController.approve);
router.post('/:id/request-approval', authorize('deals.update.own', 'deals.update.all'), dealController.requestApproval);
router.post('/:id/approve-with-pin', authorize('deals.update.own', 'deals.update.all'), [
  param('id').isInt().withMessage('Valid deal ID is required'),
  body('pin').notEmpty().withMessage('Approval PIN is required'),
  validate,
], dealController.approveWithPin);
router.patch('/:id/collection-details', authorize('deals.update.own', 'deals.update.all', 'operations.update'), dealController.updateCollectionDetails);
router.delete('/:id', authorize('deals.delete.own', 'deals.delete.all'), dealController.remove);

// Payment tracking
router.post('/:id/payment', authorize('deals.update.own', 'deals.update.all'), dealController.updatePayment);

// Inspection report - deals.read OR inspection_reports.create/update (for inspection team)
router.put('/:id/inspection-report', authorize('deals.read.own', 'deals.read.all', 'inspection_reports.create', 'inspection_reports.update'), dealController.saveInspectionReport);

module.exports = router;
