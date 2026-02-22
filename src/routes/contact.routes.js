const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid contact ID is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

router.get('/', authorize('contacts.read'), contactController.getAll);
router.get('/:id', authorize('contacts.read'), contactController.getById);
router.post('/', authorize('contacts.create'), createValidation, contactController.create);
router.put('/:id', authorize('contacts.update'), updateValidation, contactController.update);
router.delete('/:id', authorize('contacts.delete'), contactController.remove);

module.exports = router;
