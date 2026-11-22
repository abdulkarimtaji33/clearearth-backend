/**
 * Product/Service Routes
 */
const express = require('express');
const router = express.Router();
const productServiceController = require('../controllers/productService.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Product/Service CRUD — permission-gated (products.*)
router.get('/', authorize('products.read'), productServiceController.getAll);
router.get('/:id', authorize('products.read'), productServiceController.getById);
router.post('/', authorize('products.create'), productServiceController.create);
router.put('/:id', authorize('products.update'), productServiceController.update);
router.delete('/:id', authorize('products.delete'), productServiceController.remove);

module.exports = router;
