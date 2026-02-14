const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accounting.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Journal Entries
router.get('/journal-entries', authorize('accounting.read'), accountingController.getAllJournalEntries);
router.get('/journal-entries/:id', authorize('accounting.read'), accountingController.getJournalEntryById);
router.post('/journal-entries', authorize('accounting.create'), accountingController.createJournalEntry);

// Expenses
router.get('/expenses', authorize('accounting.read'), accountingController.getAllExpenses);
router.post('/expenses', authorize('accounting.create'), accountingController.createExpense);
router.post('/expenses/:id/approve', authorize('accounting.approve'), accountingController.approveExpense);

// Fixed Assets
router.get('/fixed-assets', authorize('accounting.read'), accountingController.getAllFixedAssets);
router.post('/fixed-assets', authorize('accounting.create'), accountingController.createFixedAsset);
router.post('/depreciation/calculate', authorize('accounting.approve'), accountingController.calculateDepreciation);

// Bank Accounts
router.get('/bank-accounts', authorize('accounting.read'), accountingController.getBankAccounts);
router.post('/bank-accounts', authorize('accounting.create'), accountingController.createBankAccount);

module.exports = router;
