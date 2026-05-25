const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/trial-balance',      authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getTrialBalance);
router.get('/general-ledger',     authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getGeneralLedger);
router.get('/income-statement',   authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getIncomeStatement);
router.get('/balance-sheet',      authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getBalanceSheet);
router.get('/cash-flow',          authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getCashFlowStatement);
router.get('/changes-in-equity',  authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getChangesInEquity);
router.get('/vat-report',         authorize('reports.read', 'accounting.read', 'deals.read'), reportsController.getVatReport);

module.exports = router;
