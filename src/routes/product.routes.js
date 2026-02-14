const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('products.read'), productController.getAll);
router.get('/:id', authorize('products.read'), productController.getById);
router.post('/', authorize('products.create'), productController.create);
router.put('/:id', authorize('products.update'), productController.update);
router.post('/:id/approve', authorize('products.approve'), productController.approve);
router.post('/:id/deactivate', authorize('products.update'), productController.deactivate);
router.post('/:id/activate', authorize('products.update'), productController.activate);
router.delete('/:id', authorize('products.delete'), productController.remove);

module.exports = router;
