const express = require('express');
const router = express.Router();
const termsController = require('../controllers/termsAndConditions.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', termsController.getAll);
router.get('/:id', termsController.getById);
router.post('/', termsController.create);
router.put('/:id', termsController.update);
router.delete('/:id', termsController.remove);

module.exports = router;
