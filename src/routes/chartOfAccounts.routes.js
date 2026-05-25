const express = require('express');
const router = express.Router();
const coaController = require('../controllers/chartOfAccounts.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',        authorize('accounting.read', 'deals.read'),   coaController.listAccounts);
router.post('/seed',   authorize('accounting.update', 'deals.update'), coaController.seedAccounts);
router.post('/',       authorize('accounting.update', 'deals.update'), coaController.createAccount);
router.get('/:id',     authorize('accounting.read', 'deals.read'),   coaController.getAccount);
router.put('/:id',     authorize('accounting.update', 'deals.update'), coaController.updateAccount);
router.delete('/:id',  authorize('accounting.update', 'deals.update'), coaController.deleteAccount);

module.exports = router;
