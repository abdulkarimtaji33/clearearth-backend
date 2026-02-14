/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { body } = require('express-validator');

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const registerValidation = [
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  validate,
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate,
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  validate,
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
