const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

router.get('/', quotationController.getAll);
router.get('/:id', quotationController.getById);
router.post('/', quotationController.create);
router.put('/:id', quotationController.update);
router.post('/:id/approve', authorize('quotations.approve'), quotationController.approve);
router.post('/:id/request-approval', authorize('quotations.update.own', 'quotations.update.all'), quotationController.requestApproval);
router.post('/:id/approve-with-pin', authorize('quotations.update.own', 'quotations.update.all'), [
  param('id').isInt().withMessage('Valid quotation ID is required'),
  body('pin').notEmpty().withMessage('Approval PIN is required'),
  validate,
], quotationController.approveWithPin);
router.delete('/:id', quotationController.remove);

module.exports = router;
