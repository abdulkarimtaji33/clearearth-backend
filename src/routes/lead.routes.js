const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('phone').optional({ values: 'falsy' }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('source').notEmpty().withMessage('Lead source is required'),
  body('productServiceId').optional({ values: 'falsy' }).isInt().withMessage('Valid product/service ID is required'),
  body('companyId').optional({ values: 'falsy' }).isInt().withMessage('Valid company ID is required'),
  body('contactId').optional({ values: 'falsy' }).isInt().withMessage('Valid contact ID is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid lead ID is required'),
  body('phone').optional({ values: 'falsy' }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('companyId').optional({ values: 'falsy' }).isInt().withMessage('Valid company ID is required'),
  body('contactId').optional({ values: 'falsy' }).isInt().withMessage('Valid contact ID is required'),
  validate,
];

router.get('/', authorize('leads.read'), leadController.getAll);
router.get('/:id', authorize('leads.read'), leadController.getById);
router.post('/', authorize('leads.create'), createValidation, leadController.create);
router.put('/:id', authorize('leads.update'), updateValidation, leadController.update);
router.post('/:id/qualify', authorize('leads.update'), leadController.qualify);
router.post('/:id/disqualify', authorize('leads.update'), leadController.disqualify);
router.post('/:id/convert', authorize('leads.update'), leadController.convertToDeal);
router.delete('/:id', authorize('leads.delete'), leadController.remove);

module.exports = router;
