/**
 * HR Forms PDF Controller — IT Asset Form, Salary Certificate, Salary Slip,
 * Handover Form. Thin wrappers around hrFormsPdf.service.js.
 */
const hrFormsPdfService = require('../services/hrFormsPdf.service');
const { asyncHandler } = require('../middlewares/errorHandler');

function sendPdf(res, buffer, filename) {
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}

const downloadAssetFormPdf = asyncHandler(async (req, res) => {
  const buffer = await hrFormsPdfService.generateAssetFormPdf(req.params.employeeId, req.tenant.id);
  return sendPdf(res, buffer, `it-asset-form-${req.params.employeeId}.pdf`);
});

const downloadSalaryCertificatePdf = asyncHandler(async (req, res) => {
  const buffer = await hrFormsPdfService.generateSalaryCertificatePdf(req.params.employeeId, req.tenant.id);
  return sendPdf(res, buffer, `salary-certificate-${req.params.employeeId}.pdf`);
});

const downloadSalarySlipPdf = asyncHandler(async (req, res) => {
  const buffer = await hrFormsPdfService.generateSalarySlipPdf(req.params.employeeId, req.tenant.id);
  return sendPdf(res, buffer, `salary-slip-${req.params.employeeId}.pdf`);
});

const downloadHandoverFormPdf = asyncHandler(async (req, res) => {
  const buffer = await hrFormsPdfService.generateHandoverFormPdf(req.params.employeeId, req.tenant.id);
  return sendPdf(res, buffer, `handover-form-${req.params.employeeId}.pdf`);
});

module.exports = {
  downloadAssetFormPdf,
  downloadSalaryCertificatePdf,
  downloadSalarySlipPdf,
  downloadHandoverFormPdf,
};
