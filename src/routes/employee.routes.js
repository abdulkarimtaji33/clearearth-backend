const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Self-service: current user's own employee record (no hr.* permission required)
router.get('/me', employeeController.getMe);

router.get('/', authorize('hr.employees.read', 'hr.employees.manage'), employeeController.getAll);
router.get('/:id', authorize('hr.employees.read', 'hr.employees.manage'), employeeController.getById);
router.post('/', authorize('hr.employees.manage'), employeeController.create);
router.put('/:id', authorize('hr.employees.manage'), employeeController.update);
router.post('/:id/offboard', authorize('hr.employees.manage'), employeeController.offboard);

router.get('/:id/salary-structure', authorize('hr.employees.manage'), employeeController.getSalaryStructureHistory);
router.post('/:id/salary-structure', authorize('hr.employees.manage'), employeeController.setSalaryStructure);

module.exports = router;
