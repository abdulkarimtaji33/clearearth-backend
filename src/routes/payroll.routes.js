const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Self-service
router.get('/my-payslips', payrollController.getMyPayslips);
router.get('/payslips/:id', payrollController.getPayslip); // internal ownership check
router.get('/payslips/:id/pdf', payrollController.downloadPayslipPdf);

// HR / Accounts
router.get('/runs', authorize('hr.payroll.read', 'hr.payroll.process'), payrollController.listRuns);
router.get('/runs/:id', authorize('hr.payroll.read', 'hr.payroll.process'), payrollController.getRunDetail);
router.post('/runs', authorize('hr.payroll.process'), payrollController.createRun);
router.post('/runs/:id/process', authorize('hr.payroll.process'), payrollController.process);
router.post('/runs/:id/approve', authorize('hr.payroll.process'), payrollController.approve);
router.post('/runs/:id/mark-paid', authorize('hr.payroll.process'), payrollController.markPaid);

module.exports = router;
