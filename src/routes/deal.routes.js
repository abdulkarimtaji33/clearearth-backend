const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('deals.read'), dealController.getAll);
router.get('/statistics', authorize('deals.read'), dealController.getStatistics);
router.get('/:id', authorize('deals.read'), dealController.getById);
router.post('/', authorize('deals.create'), dealController.create);
router.put('/:id', authorize('deals.update'), dealController.update);
router.post('/:id/move-stage', authorize('deals.update'), dealController.moveToStage);
router.post('/:id/finalize', authorize('deals.approve'), dealController.finalize);
router.delete('/:id', authorize('deals.delete'), dealController.remove);

module.exports = router;
