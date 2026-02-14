const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('clientType').isIn(['individual', 'company']).withMessage('Invalid client type'),
  body('companyName')
    .if(body('clientType').equals('company'))
    .notEmpty().withMessage('Company name is required for company type'),
  body('firstName')
    .if(body('clientType').equals('individual'))
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .if(body('clientType').equals('individual'))
    .notEmpty().withMessage('Last name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('phone').optional({ values: 'falsy' }).notEmpty().withMessage('Phone is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid client ID is required'),
  body('email').optional().isEmail(),
  validate,
];

router.get('/', authorize('clients.read'), clientController.getAll);
router.get('/:id', authorize('clients.read'), clientController.getById);
router.get('/:id/statistics', authorize('clients.read'), clientController.getStatistics);
router.post('/', authorize('clients.create'), createValidation, clientController.create);
router.put('/:id', authorize('clients.update'), updateValidation, clientController.update);
router.post('/:id/approve', authorize('clients.approve'), clientController.approve);
router.post('/:id/deactivate', authorize('clients.update'), clientController.deactivate);
router.post('/:id/activate', authorize('clients.update'), clientController.activate);
router.delete('/:id', authorize('clients.delete'), clientController.remove);

module.exports = router;
