const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('leads.read'), leadController.getAll);
router.get('/:id', authorize('leads.read'), leadController.getById);
router.post('/', authorize('leads.create'), leadController.create);
router.put('/:id', authorize('leads.update'), leadController.update);
router.post('/:id/qualify', authorize('leads.update'), leadController.qualify);
router.post('/:id/disqualify', authorize('leads.update'), leadController.disqualify);
router.post('/:id/convert', authorize('leads.update'), leadController.convertToDeal);
router.delete('/:id', authorize('leads.delete'), leadController.remove);

module.exports = router;
