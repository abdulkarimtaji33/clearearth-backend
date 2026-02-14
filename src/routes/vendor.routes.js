const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

router.use(authenticate);

const createValidation = [
  body('vendorType').isIn(['individual', 'company']).withMessage('Invalid vendor type'),
  body('companyName')
    .if(body('vendorType').equals('company'))
    .notEmpty().withMessage('Company name is required for company type'),
  body('firstName')
    .if(body('vendorType').equals('individual'))
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .if(body('vendorType').equals('individual'))
    .notEmpty().withMessage('Last name is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('phone').optional({ values: 'falsy' }).notEmpty().withMessage('Phone is required'),
  validate,
];

const updateValidation = [
  param('id').isInt().withMessage('Valid vendor ID is required'),
  body('email').optional().isEmail(),
  validate,
];

router.get('/', authorize('vendors.read'), vendorController.getAll);
router.get('/:id', authorize('vendors.read'), vendorController.getById);
router.post('/', authorize('vendors.create'), createValidation, vendorController.create);
router.put('/:id', authorize('vendors.update'), updateValidation, vendorController.update);
router.post('/:id/approve', authorize('vendors.approve'), vendorController.approve);
router.post('/:id/deactivate', authorize('vendors.update'), vendorController.deactivate);
router.post('/:id/activate', authorize('vendors.update'), vendorController.activate);
router.delete('/:id', authorize('vendors.delete'), vendorController.remove);

module.exports = router;
