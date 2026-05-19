const express = require('express');
const router = express.Router();
const coaController = require('../controllers/chartOfAccounts.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',        authorize('deals.read'),   coaController.listAccounts);
router.post('/seed',   authorize('deals.update'), coaController.seedAccounts);
router.post('/',       authorize('deals.update'), coaController.createAccount);
router.get('/:id',     authorize('deals.read'),   coaController.getAccount);
router.put('/:id',     authorize('deals.update'), coaController.updateAccount);
router.delete('/:id',  authorize('deals.update'), coaController.deleteAccount);

module.exports = router;
