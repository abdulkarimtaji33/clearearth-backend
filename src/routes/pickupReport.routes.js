const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pickupReport.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', authorize('operations.read'), ctrl.list);
router.get('/export', authorize('operations.read'), ctrl.exportCsv);
router.get('/:taskId/pdf', authorize('operations.read'), ctrl.notePdf);

module.exports = router;
