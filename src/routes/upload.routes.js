const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');

router.post('/inspection-document', authenticate, uploadSingle('file'), uploadController.uploadInspectionDocument);
router.post('/deal-image', authenticate, uploadSingle('file'), uploadController.uploadDealImage);
router.post('/wds-attachment', authenticate, uploadSingle('file'), uploadController.uploadWdsAttachment);
router.post('/tenant-logo', authenticate, uploadSingle('file'), uploadController.uploadTenantLogo);

module.exports = router;
