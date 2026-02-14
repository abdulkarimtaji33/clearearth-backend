/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body, param } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// Validation
const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('roleId').isInt().withMessage('Valid role ID is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
];

const updateUserValidation = [
  param('id').isInt().withMessage('Valid user ID is required'),
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('email').optional().isEmail(),
  validate,
];

// Routes
router.get('/', authorize('users.read'), userController.getAll);
router.get('/:id', authorize('users.read'), userController.getById);
router.post('/', authorize('users.create'), createUserValidation, userController.create);
router.put('/:id', authorize('users.update'), updateUserValidation, userController.update);
router.delete('/:id', authorize('users.delete'), userController.remove);

module.exports = router;
