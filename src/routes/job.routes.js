const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('jobs.read'), jobController.getAll);
router.get('/:id', authorize('jobs.read'), jobController.getById);
router.post('/', authorize('jobs.create'), jobController.create);
router.put('/:id', authorize('jobs.update'), jobController.update);
router.post('/:id/status', authorize('jobs.update'), jobController.updateStatus);
router.delete('/:id', authorize('jobs.delete'), jobController.remove);

module.exports = router;
