const express = require('express');
const router = express.Router();
const workTypeController = require('../controllers/workType.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('operations.read', 'deals.read'), workTypeController.getAll);
router.get('/:id', authorize('operations.read', 'deals.read'), workTypeController.getById);
router.post('/', authorize('operations.create', 'deals.create'), workTypeController.create);
router.put('/:id', authorize('operations.update', 'deals.update'), workTypeController.update);
router.delete('/:id', authorize('operations.delete', 'deals.delete'), workTypeController.remove);

module.exports = router;
