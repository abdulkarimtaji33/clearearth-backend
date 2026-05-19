const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/trial-balance',      authorize('deals.read'), reportsController.getTrialBalance);
router.get('/general-ledger',     authorize('deals.read'), reportsController.getGeneralLedger);
router.get('/income-statement',   authorize('deals.read'), reportsController.getIncomeStatement);
router.get('/balance-sheet',      authorize('deals.read'), reportsController.getBalanceSheet);
router.get('/cash-flow',          authorize('deals.read'), reportsController.getCashFlowStatement);
router.get('/changes-in-equity',  authorize('deals.read'), reportsController.getChangesInEquity);
router.get('/vat-report',         authorize('deals.read'), reportsController.getVatReport);

module.exports = router;
