const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', quotationController.getAll);
router.get('/:id', quotationController.getById);
router.post('/', quotationController.create);
router.put('/:id', quotationController.update);
router.delete('/:id', quotationController.remove);

module.exports = router;
