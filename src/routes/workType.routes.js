const express = require('express');
const router = express.Router();
const workTypeController = require('../controllers/workType.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('deals.read'), workTypeController.getAll);
router.get('/:id', authorize('deals.read'), workTypeController.getById);
router.post('/', authorize('deals.create'), workTypeController.create);
router.put('/:id', authorize('deals.update'), workTypeController.update);
router.delete('/:id', authorize('deals.delete'), workTypeController.remove);

module.exports = router;
