const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// ── Catalog, audit and per-user access (declared before "/:id" routes) ──────
router.get('/catalog', authorize('roles.read'), roleController.getCatalog);
router.get('/permissions/all', authorize('roles.read'), roleController.getAllPermissions);
router.get('/permissions/:name/holders', authorize('roles.read'), roleController.getPermissionHolders);
router.get('/audit', authorize('roles.read'), roleController.getAudit);
router.get('/user-access/:userId', authorize('roles.read', 'users.read'), roleController.getUserAccess);
router.put('/user-access/:userId/overrides', authorize('roles.update'), roleController.saveUserOverrides);

// ── Roles ───────────────────────────────────────────────────────────────────
router.get('/', authorize('roles.read', 'users.read', 'users.create'), roleController.getAll);
router.get('/:id', authorize('roles.read'), roleController.getById);
router.get('/:id/users', authorize('roles.read'), roleController.getUsers);
router.post('/', authorize('roles.create'), roleController.create);
router.post('/:id/clone', authorize('roles.create'), roleController.clone);
router.put('/:id', authorize('roles.update'), roleController.update);
router.put('/:id/access', authorize('roles.update'), roleController.saveAccess);
router.post('/:id/permissions', authorize('roles.update'), roleController.assignPermissions);
router.post('/:id/reset', authorize('roles.update'), roleController.reset);
router.delete('/:id', authorize('roles.delete'), roleController.remove);

module.exports = router;
