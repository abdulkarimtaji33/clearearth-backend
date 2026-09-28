const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Self-service
router.post('/requests', leaveController.createRequest);
router.post('/requests/:id/cancel', leaveController.cancel);
router.get('/my-balances', leaveController.getMyBalances);
router.get('/requests', leaveController.list); // scoped internally: ?mine=true for self, else manager/HR scope

// Approvals
router.post('/requests/:id/approve', authorize('hr.leave.approve'), leaveController.approve);
router.post('/requests/:id/reject', authorize('hr.leave.approve'), leaveController.reject);

// HR read/manage
router.get('/balances/:employeeId', authorize('hr.leave.read', 'hr.leave.approve'), leaveController.getBalances);

// Settings (HR)
router.get('/types', authorize('hr.leave.read', 'hr.settings.manage'), leaveController.listLeaveTypes);
router.post('/types', authorize('hr.settings.manage'), leaveController.createLeaveType);
router.put('/types/:id', authorize('hr.settings.manage'), leaveController.updateLeaveType);
router.get('/holidays', authorize('hr.leave.read', 'hr.settings.manage'), leaveController.listHolidays);
router.post('/holidays', authorize('hr.settings.manage'), leaveController.createHoliday);
router.delete('/holidays/:id', authorize('hr.settings.manage'), leaveController.deleteHoliday);

module.exports = router;
