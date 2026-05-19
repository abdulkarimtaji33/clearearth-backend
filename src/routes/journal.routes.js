const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',                    authorize('deals.read'),   journalController.listEntries);
router.post('/',                   authorize('deals.update'), journalController.createManualEntry);
router.post('/opening-balances',   authorize('deals.update'), journalController.postOpeningBalances);
router.get('/:id',                 authorize('deals.read'),   journalController.getEntry);
router.post('/:id/void',           authorize('deals.update'), journalController.voidEntry);

module.exports = router;
