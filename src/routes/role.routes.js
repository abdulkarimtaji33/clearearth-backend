const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('roles.read'), roleController.getAll);
router.get('/permissions/all', authorize('roles.read'), roleController.getAllPermissions);
router.get('/:id', authorize('roles.read'), roleController.getById);
router.post('/', authorize('roles.create'), roleController.create);
router.put('/:id', authorize('roles.update'), roleController.update);
router.post('/:id/permissions', authorize('roles.update'), roleController.assignPermissions);
router.delete('/:id', authorize('roles.delete'), roleController.remove);

module.exports = router;
