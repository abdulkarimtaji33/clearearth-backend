/**
 * Deal Routes
 */
const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Deal CRUD
router.get('/', authorize('deals.read'), dealController.getAll);
router.get('/:id', authorize('deals.read'), dealController.getById);
router.post('/', authorize('deals.create'), dealController.create);
router.put('/:id', authorize('deals.update'), dealController.update);
router.delete('/:id', authorize('deals.delete'), dealController.remove);

// Payment tracking
router.post('/:id/payment', authorize('deals.update'), dealController.updatePayment);

// Inspection report - deals.read OR inspection_reports.create/update (for inspection team)
router.put('/:id/inspection-report', authorize('deals.read', 'inspection_reports.create', 'inspection_reports.update'), dealController.saveInspectionReport);

module.exports = router;
