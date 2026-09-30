const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Certificate requests
router.get('/certificate-requests', authorize('certificates.read'), certificateController.listRequests);
router.get('/certificate-requests/:id', authorize('certificates.read'), certificateController.getRequestById);
router.post('/certificate-requests', authorize('certificates.create'), certificateController.createRequest);
router.post('/certificate-requests/:id/attachments', authorize('certificates.create'), certificateController.uploadAttachment);
router.post('/certificate-requests/:id/verify', authorize('certificates.verify'), certificateController.verifyRequest);
router.post('/certificate-requests/:id/generate', authorize('certificates.verify'), certificateController.generate);

// Certificates (register)
router.get('/certificates', authorize('certificates.read'), certificateController.listCertificates);
router.get('/certificates/:id', authorize('certificates.read'), certificateController.getCertificateById);
router.get('/certificates/:id/pdf', authorize('certificates.read'), certificateController.getPdf);

// Carbon footprint factors (admin settings)
router.get('/carbon-footprint-factors', authorize('certificates.manage'), certificateController.listCarbonFactors);
router.post('/carbon-footprint-factors', authorize('certificates.manage'), certificateController.upsertCarbonFactor);

module.exports = router;
