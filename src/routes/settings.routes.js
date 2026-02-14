const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('settings.read'), settingsController.getTenantSettings);
router.put('/', authorize('settings.update'), settingsController.updateTenantSettings);

// Currencies
router.get('/currencies', authorize('settings.read'), settingsController.getAllCurrencies);
router.post('/currencies', authorize('settings.update'), settingsController.createCurrency);
router.put('/currencies/:id', authorize('settings.update'), settingsController.updateCurrency);

// Taxes
router.get('/taxes', authorize('settings.read'), settingsController.getAllTaxes);
router.post('/taxes', authorize('settings.update'), settingsController.createTax);
router.put('/taxes/:id', authorize('settings.update'), settingsController.updateTax);

// Payment Modes
router.get('/payment-modes', authorize('settings.read'), settingsController.getAllPaymentModes);
router.post('/payment-modes', authorize('settings.update'), settingsController.createPaymentMode);
router.put('/payment-modes/:id', authorize('settings.update'), settingsController.updatePaymentMode);

// Expense Categories
router.get('/expense-categories', authorize('settings.read'), settingsController.getAllExpenseCategories);
router.post('/expense-categories', authorize('settings.update'), settingsController.createExpenseCategory);
router.put('/expense-categories/:id', authorize('settings.update'), settingsController.updateExpenseCategory);

// Material Types
router.get('/material-types', authorize('settings.read'), settingsController.getAllMaterialTypes);
router.post('/material-types', authorize('settings.update'), settingsController.createMaterialType);
router.put('/material-types/:id', authorize('settings.update'), settingsController.updateMaterialType);

module.exports = router;
