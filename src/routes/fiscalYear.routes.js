const express = require('express');
const router = express.Router();
const fyController = require('../controllers/fiscalYear.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',                                     authorize('deals.read'),   fyController.listFiscalYears);
router.post('/',                                    authorize('deals.update'), fyController.createFiscalYear);
router.post('/:id/close',                           authorize('deals.update'), fyController.closeFiscalYear);
router.get('/:id/periods',                          authorize('deals.read'),   fyController.listPeriods);
router.post('/:id/periods/:periodId/close',         authorize('deals.update'), fyController.closePeriod);
router.post('/:id/periods/:periodId/reopen',        authorize('deals.update'), fyController.reopenPeriod);

module.exports = router;
