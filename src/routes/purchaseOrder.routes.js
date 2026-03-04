const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', purchaseOrderController.getAll);
router.get('/:id', purchaseOrderController.getById);
router.post('/', purchaseOrderController.create);
router.put('/:id', purchaseOrderController.update);
router.delete('/:id', purchaseOrderController.remove);

module.exports = router;
