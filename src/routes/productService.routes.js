/**
 * Product/Service Routes
 */
const express = require('express');
const router = express.Router();
const productServiceController = require('../controllers/productService.controller');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Product/Service CRUD
router.get('/', productServiceController.getAll);
router.get('/:id', productServiceController.getById);
router.post('/', productServiceController.create);
router.put('/:id', productServiceController.update);
router.delete('/:id', productServiceController.remove);

module.exports = router;
