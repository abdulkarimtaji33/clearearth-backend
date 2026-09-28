const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('hr.employees.read', 'hr.settings.manage'), departmentController.getAll);
router.get('/:id', authorize('hr.employees.read', 'hr.settings.manage'), departmentController.getById);
router.post('/', authorize('hr.settings.manage'), departmentController.create);
router.put('/:id', authorize('hr.settings.manage'), departmentController.update);
router.delete('/:id', authorize('hr.settings.manage'), departmentController.remove);

module.exports = router;
