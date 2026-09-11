const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/', quotationController.getAll);
router.get('/:id', quotationController.getById);
router.post('/', quotationController.create);
router.put('/:id', quotationController.update);
router.post('/:id/approve', authorize('quotations.approve'), quotationController.approve);
router.post('/:id/request-approval', authorize('quotations.update'), [
  body('requestedPickupDate').optional({ nullable: true }).isISO8601().withMessage('Requested pickup date must be a valid date'),
  validate,
], quotationController.requestApproval);
router.delete('/:id', quotationController.remove);

module.exports = router;
