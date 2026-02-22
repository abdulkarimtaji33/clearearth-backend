const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid supplier ID is required'),
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

const addContactValidation = [
  param('id').isInt().withMessage('Valid supplier ID is required'),
  body('contactId').isInt().withMessage('Valid contact ID is required'),
  validate,
];

router.get('/', authorize('suppliers.read'), supplierController.getAll);
router.get('/:id', authorize('suppliers.read'), supplierController.getById);
router.post('/', authorize('suppliers.create'), createValidation, supplierController.create);
router.put('/:id', authorize('suppliers.update'), updateValidation, supplierController.update);
router.delete('/:id', authorize('suppliers.delete'), supplierController.remove);
router.post('/:id/contacts', authorize('suppliers.update'), addContactValidation, supplierController.addContact);
router.delete('/:id/contacts/:contactId', authorize('suppliers.update'), supplierController.removeContact);

module.exports = router;
