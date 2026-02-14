const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('services.read'), serviceController.getAll);
router.get('/:id', authorize('services.read'), serviceController.getById);
router.post('/', authorize('services.create'), serviceController.create);
router.put('/:id', authorize('services.update'), serviceController.update);
router.post('/:id/approve', authorize('services.approve'), serviceController.approve);
router.post('/:id/deactivate', authorize('services.update'), serviceController.deactivate);
router.post('/:id/activate', authorize('services.update'), serviceController.activate);
router.delete('/:id', authorize('services.delete'), serviceController.remove);

module.exports = router;
