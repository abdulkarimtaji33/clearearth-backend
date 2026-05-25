const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',                    authorize('accounting.read', 'deals.read'),   journalController.listEntries);
router.post('/',                   authorize('accounting.update', 'deals.update'), journalController.createManualEntry);
router.post('/opening-balances',   authorize('accounting.update', 'deals.update'), journalController.postOpeningBalances);
router.get('/:id',                 authorize('accounting.read', 'deals.read'),   journalController.getEntry);
router.post('/:id/void',           authorize('accounting.update', 'deals.update'), journalController.voidEntry);

module.exports = router;
