const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('contactType').notEmpty().withMessage('Contact type is required').isIn(['clients', 'vendors']).withMessage('Contact type must be clients or vendors'),
  body('lastName').optional({ values: 'falsy' }),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('companyId').optional({ values: 'falsy' }).isInt().withMessage('Valid company ID is required'),
  body('supplierId').optional({ values: 'falsy' }).isInt().withMessage('Valid supplier ID is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid contact ID is required'),
  body('phone').optional({ values: 'falsy' }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('companyId').optional({ values: 'falsy' }).isInt().withMessage('Valid company ID is required'),
  body('supplierId').optional({ values: 'falsy' }).isInt().withMessage('Valid supplier ID is required'),
  validate,
];

router.get('/', authorize('contacts.read'), contactController.getAll);
router.get('/:id', authorize('contacts.read'), contactController.getById);
router.post('/', authorize('contacts.create'), createValidation, contactController.create);
router.put('/:id', authorize('contacts.update'), updateValidation, contactController.update);
router.delete('/:id', authorize('contacts.delete'), contactController.remove);

module.exports = router;
