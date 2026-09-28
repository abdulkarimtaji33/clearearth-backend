const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Self-service — no hr.* permission required, just a linked employee record
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/my-sheet', attendanceController.getMyMonthlySheet);
router.post('/regularizations', attendanceController.createRegularization);

// HR
router.get('/', authorize('hr.attendance.read', 'hr.attendance.manage'), attendanceController.listAttendance);
router.post('/manual', authorize('hr.attendance.manage'), attendanceController.manualUpsert);
router.get('/sheet/:employeeId', authorize('hr.attendance.read', 'hr.attendance.manage'), attendanceController.getMonthlySheet);
router.get('/regularizations', authorize('hr.attendance.read', 'hr.attendance.manage'), attendanceController.listRegularizations);
router.post('/regularizations/:id/review', authorize('hr.attendance.manage'), attendanceController.reviewRegularization);

module.exports = router;
