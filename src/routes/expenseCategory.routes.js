const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategory.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('accounting.read'), expenseCategoryController.getAll);
router.get('/:id', authorize('accounting.read'), expenseCategoryController.getById);
router.post('/', authorize('accounting.create'), expenseCategoryController.create);
router.put('/:id', authorize('accounting.update'), expenseCategoryController.update);
router.delete('/:id', authorize('accounting.delete'), expenseCategoryController.remove);

module.exports = router;
