/**
 * Deal Routes
 */
const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Deal CRUD
router.get('/', dealController.getAll);
router.get('/:id', dealController.getById);
router.post('/', dealController.create);
router.put('/:id', dealController.update);
router.delete('/:id', dealController.remove);

// Payment tracking
router.post('/:id/payment', dealController.updatePayment);

// Inspection report
router.put('/:id/inspection-report', dealController.saveInspectionReport);

module.exports = router;
