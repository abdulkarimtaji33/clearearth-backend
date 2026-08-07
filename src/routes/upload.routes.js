const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');

router.post('/inspection-document', authenticate, uploadSingle('file'), uploadController.uploadInspectionDocument);
router.post('/deal-image', authenticate, uploadSingle('file'), uploadController.uploadDealImage);
router.post('/company-document', authenticate, uploadSingle('file'), uploadController.uploadCompanyDocument);
router.post('/wds-attachment', authenticate, uploadSingle('file'), uploadController.uploadWdsAttachment);
router.post('/tenant-logo', authenticate, uploadSingle('file'), uploadController.uploadTenantLogo);
// Per-user signature — any authenticated user manages their own.
router.post('/my-signature', authenticate, uploadSingle('file'), uploadController.uploadMySignature);
router.delete('/my-signature', authenticate, uploadController.deleteMySignature);
// Company-wide fallback signature (admin-managed via Company Settings).
router.post('/tenant-signature', authenticate, uploadSingle('file'), uploadController.uploadTenantSignature);
router.delete('/tenant-signature', authenticate, uploadController.deleteTenantSignature);
router.post('/tax-invoice-attachment', authenticate, uploadSingle('file'), uploadController.uploadTaxInvoiceAttachment);
router.post('/expense-evidence', authenticate, uploadSingle('file'), uploadController.uploadExpenseEvidence);

module.exports = router;
