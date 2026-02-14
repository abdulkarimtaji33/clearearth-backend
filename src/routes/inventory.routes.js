const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('inventory.read'), inventoryController.getAllInventory);
router.get('/valuation', authorize('inventory.read'), inventoryController.getInventoryValuation);
router.get('/lots', authorize('inventory.read'), inventoryController.getAllLots);
router.get('/lots/:id', authorize('inventory.read'), inventoryController.getLotById);
router.post('/lots', authorize('inventory.create'), inventoryController.createLot);
router.put('/lots/:id', authorize('inventory.update'), inventoryController.updateLot);
router.post('/lots/:id/adjust', authorize('inventory.update'), inventoryController.adjustLotQuantity);
router.post('/lots/:id/close', authorize('inventory.update'), inventoryController.closeLot);
router.get('/movements', authorize('inventory.read'), inventoryController.getStockMovements);

module.exports = router;
