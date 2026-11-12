const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cashBank.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/transfers', authorize('accounting.read'), ctrl.listTransfers);
router.get('/transfers/:id', authorize('accounting.read'), ctrl.getTransfer);
router.post('/transfers', authorize('accounting.create'), ctrl.createTransfer);

router.get('/reconciliation/workspace', authorize('accounting.read'), ctrl.workspace);
router.get('/reconciliation', authorize('accounting.read'), ctrl.listRecon);
router.get('/reconciliation/:id', authorize('accounting.read'), ctrl.reportRecon);
router.post('/reconciliation', authorize('accounting.create'), ctrl.saveRecon);

module.exports = router;
