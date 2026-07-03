const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('phone').optional({ values: 'falsy' }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid company ID is required'),
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('phone').optional({ values: 'falsy' }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  validate,
];

const addContactValidation = [
  param('id').isInt().withMessage('Valid company ID is required'),
  body('contactId').isInt().withMessage('Valid contact ID is required'),
  validate,
];

router.get('/', authorize('companies.read.own', 'companies.read.all'), companyController.getAll);
router.get('/:id', authorize('companies.read.own', 'companies.read.all'), companyController.getById);
router.post('/', authorize('companies.create'), createValidation, companyController.create);
router.put('/:id', authorize('companies.update.own', 'companies.update.all'), updateValidation, companyController.update);
router.delete('/:id', authorize('companies.delete.own', 'companies.delete.all'), companyController.remove);
router.post('/:id/contacts', authorize('companies.update.own', 'companies.update.all'), addContactValidation, companyController.addContact);
router.delete('/:id/contacts/:contactId', authorize('companies.update.own', 'companies.update.all'), companyController.removeContact);

module.exports = router;
