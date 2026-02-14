const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('certificates.read'), certificateController.getAll);
router.get('/:id', authorize('certificates.read'), certificateController.getById);
router.post('/', authorize('certificates.create'), certificateController.create);
router.post('/:id/verify', authorize('certificates.approve'), certificateController.verify);
router.delete('/:id', authorize('certificates.delete'), certificateController.remove);

// Templates
router.get('/templates/all', authorize('certificates.read'), certificateController.getAllTemplates);
router.get('/templates/:templateId', authorize('certificates.read'), certificateController.getTemplateById);
router.post('/templates', authorize('certificates.create'), certificateController.createTemplate);
router.put('/templates/:templateId', authorize('certificates.update'), certificateController.updateTemplate);

module.exports = router;
