/**
 * Payroll Controller (HRM)
 */
const payrollService = require('../services/payroll.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const createRun = asyncHandler(async (req, res) => {
  const run = await payrollService.createRun(req.tenant.id, req.user.id, req.body.periodMonth, req.body.periodYear);
  return ApiResponse.created(res, run, 'Payroll run created');
});

const process = asyncHandler(async (req, res) => {
  const run = await payrollService.process(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, run, 'Payroll run processed');
});

const approve = asyncHandler(async (req, res) => {
  const run = await payrollService.approve(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, run, 'Payroll run approved and posted to the ledger');
});

const markPaid = asyncHandler(async (req, res) => {
  const run = await payrollService.markPaid(req.tenant.id, req.user.id, req.params.id, {
    paymentAccountCode: req.body.paymentAccountCode,
    payslipIds: req.body.payslipIds,
  });
  return ApiResponse.success(res, run, 'Payroll run marked as paid');
});

const listRuns = asyncHandler(async (req, res) => {
  const rows = await payrollService.listRuns(req.tenant.id, { status: req.query.status });
  return ApiResponse.success(res, rows);
});

const getRunDetail = asyncHandler(async (req, res) => {
  const run = await payrollService.getRunDetail(req.tenant.id, req.params.id);
  return ApiResponse.success(res, run);
});

const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await payrollService.getPayslip(req.tenant.id, req.user, req.params.id);
  return ApiResponse.success(res, payslip);
});

const getMyPayslips = asyncHandler(async (req, res) => {
  const rows = await payrollService.getMyPayslips(req.tenant.id, req.user.id);
  return ApiResponse.success(res, rows);
});

const downloadPayslipPdf = asyncHandler(async (req, res) => {
  await payrollService.getPayslip(req.tenant.id, req.user, req.params.id); // permission check
  const pdfService = require('../services/pdf.service');
  const buffer = await pdfService.generatePayslipPdf(req.params.id, req.tenant.id);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="payslip-${req.params.id}.pdf"`);
  return res.send(buffer);
});

module.exports = { createRun, process, approve, markPaid, listRuns, getRunDetail, getPayslip, getMyPayslips, downloadPayslipPdf };
