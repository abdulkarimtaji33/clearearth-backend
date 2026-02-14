const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('employees.read'), employeeController.getAll);
router.get('/:id', authorize('employees.read'), employeeController.getById);
router.post('/', authorize('employees.create'), employeeController.create);
router.put('/:id', authorize('employees.update'), employeeController.update);
router.post('/:id/terminate', authorize('employees.update'), employeeController.terminate);
router.delete('/:id', authorize('employees.delete'), employeeController.remove);

module.exports = router;
