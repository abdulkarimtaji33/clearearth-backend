/**
 * Attendance Service (HRM)
 * Check-in/out is an explicit, employee-initiated button action (never automatic
 * on login/logout). Weekend convention is UAE (Friday/Saturday), hardcoded.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const employeeService = require('./employee.service');

const WEEKEND_DAYS = [5, 6]; // 0=Sun ... 5=Fri, 6=Sat (JS Date.getDay())
const LATE_THRESHOLD_HOUR = 9;
const LATE_THRESHOLD_MINUTE = 15;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const checkIn = async (tenantId, actorUserId) => {
  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  const date = todayStr();
  const now = new Date();

  let record = await db.AttendanceRecord.findOne({ where: { tenant_id: tenantId, employee_id: employee.id, attendance_date: date } });
  if (record && record.check_in_time) throw ApiError.conflict('Already checked in today');

  const isLate = now.getHours() > LATE_THRESHOLD_HOUR || (now.getHours() === LATE_THRESHOLD_HOUR && now.getMinutes() > LATE_THRESHOLD_MINUTE);
  const status = isLate ? 'late' : 'present';

  if (record) {
    await record.update({ check_in_time: now, check_in_source: 'self', status });
  } else {
    record = await db.AttendanceRecord.create({
      tenant_id: tenantId, employee_id: employee.id, attendance_date: date,
      check_in_time: now, check_in_source: 'self', status,
    });
  }
  return record;
};

const checkOut = async (tenantId, actorUserId) => {
  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  const date = todayStr();
  const now = new Date();

  const record = await db.AttendanceRecord.findOne({ where: { tenant_id: tenantId, employee_id: employee.id, attendance_date: date } });
  if (!record || !record.check_in_time) throw ApiError.badRequest('You have not checked in today');
  if (record.check_out_time) throw ApiError.conflict('Already checked out today');

  const workHours = (now.getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60 * 60);
  await record.update({
    check_out_time: now,
    check_out_source: 'self',
    work_hours: Math.max(0, Math.round(workHours * 100) / 100),
  });
  return record;
};

const getTodayStatus = async (tenantId, actorUserId) => {
  const employee = await employeeService.getByUserId(tenantId, actorUserId);
  if (!employee) return null;
  const record = await db.AttendanceRecord.findOne({ where: { tenant_id: tenantId, employee_id: employee.id, attendance_date: todayStr() } });
  return record;
};

/** HR-permission-gated: create/update any employee's attendance row for any date */
const manualUpsert = async (tenantId, actorUserId, body) => {
  const { employeeId, attendanceDate, checkInTime, checkOutTime, status, notes } = body;
  if (!employeeId || !attendanceDate) throw ApiError.badRequest('employeeId and attendanceDate are required');

  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  let workHours = null;
  if (checkInTime && checkOutTime) {
    workHours = Math.max(0, Math.round(((new Date(checkOutTime) - new Date(checkInTime)) / (1000 * 60 * 60)) * 100) / 100);
  }

  const [record] = await db.AttendanceRecord.findOrCreate({
    where: { tenant_id: tenantId, employee_id: employeeId, attendance_date: attendanceDate },
    defaults: {
      tenant_id: tenantId, employee_id: employeeId, attendance_date: attendanceDate,
      check_in_time: checkInTime || null, check_out_time: checkOutTime || null,
      check_in_source: 'hr_manual', check_out_source: 'hr_manual',
      status: status || 'present', work_hours: workHours, notes: notes || null, entered_by: actorUserId,
    },
  });

  await record.update({
    check_in_time: checkInTime !== undefined ? (checkInTime || null) : record.check_in_time,
    check_out_time: checkOutTime !== undefined ? (checkOutTime || null) : record.check_out_time,
    check_in_source: 'hr_manual',
    check_out_source: 'hr_manual',
    status: status || record.status,
    work_hours: workHours !== null ? workHours : record.work_hours,
    notes: notes !== undefined ? notes : record.notes,
    entered_by: actorUserId,
  });

  return record;
};

/** Upsert just the status (used internally, e.g. by leave approval to mark 'on_leave') */
const setStatusForDate = async (tenantId, employeeId, attendanceDate, status) => {
  const [record] = await db.AttendanceRecord.findOrCreate({
    where: { tenant_id: tenantId, employee_id: employeeId, attendance_date: attendanceDate },
    defaults: {
      tenant_id: tenantId, employee_id: employeeId, attendance_date: attendanceDate,
      status, check_in_source: 'hr_manual', check_out_source: 'hr_manual',
    },
  });
  if (record.status !== status) await record.update({ status });
  return record;
};

const listAttendance = async (tenantId, filters = {}) => {
  const { offset, limit, employeeId, dateFrom, dateTo, status } = filters;
  const where = { tenant_id: tenantId };
  if (employeeId) where.employee_id = employeeId;
  if (status) where.status = status;
  if (dateFrom) where.attendance_date = { ...(where.attendance_date || {}), [Op.gte]: dateFrom };
  if (dateTo) where.attendance_date = { ...(where.attendance_date || {}), [Op.lte]: dateTo };

  const total = await db.AttendanceRecord.count({ where });
  const rows = await db.AttendanceRecord.findAll({
    where,
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code'] }],
    offset, limit,
    order: [['attendance_date', 'DESC']],
  });
  return { records: rows, total };
};

/** One row per calendar day for the month, deriving weekend/holiday/absent status */
const getMonthlySheet = async (tenantId, employeeId, year, month) => {
  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const periodStart = `${year}-${monthStr}-01`;
  const periodEnd = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const [records, holidays] = await Promise.all([
    db.AttendanceRecord.findAll({ where: { tenant_id: tenantId, employee_id: employeeId, attendance_date: { [Op.between]: [periodStart, periodEnd] } } }),
    db.Holiday.findAll({ where: { tenant_id: tenantId, holiday_date: { [Op.between]: [periodStart, periodEnd] } } }),
  ]);

  const recordByDate = {};
  records.forEach((r) => { recordByDate[r.attendance_date] = r; });
  const holidayByDate = {};
  holidays.forEach((h) => { holidayByDate[h.holiday_date] = h; });

  const today = todayStr();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
    const dow = new Date(year, month - 1, d).getDay();
    const rec = recordByDate[dateStr];

    let status;
    let record = null;
    if (rec) {
      status = rec.status;
      record = rec;
    } else if (holidayByDate[dateStr]) {
      status = 'holiday';
    } else if (WEEKEND_DAYS.includes(dow)) {
      status = 'weekend';
    } else if (dateStr > today) {
      status = null; // future date, no verdict yet
    } else if (dateStr < employee.date_of_joining) {
      status = null; // before joining
    } else {
      status = 'absent';
    }

    days.push({
      date: dateStr,
      status,
      checkInTime: record?.check_in_time || null,
      checkOutTime: record?.check_out_time || null,
      workHours: record?.work_hours || null,
      notes: record?.notes || null,
    });
  }

  return { employeeId: Number(employeeId), year: Number(year), month: Number(month), days };
};

// -- Regularization requests ------------------------------------------------

const createRegularization = async (tenantId, actorUserId, body) => {
  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  const { attendanceDate, requestedCheckIn, requestedCheckOut, reason } = body;
  if (!attendanceDate || !reason) throw ApiError.badRequest('attendanceDate and reason are required');

  return db.AttendanceRegularizationRequest.create({
    tenant_id: tenantId,
    employee_id: employee.id,
    attendance_date: attendanceDate,
    requested_check_in: requestedCheckIn || null,
    requested_check_out: requestedCheckOut || null,
    reason,
    status: 'pending',
  });
};

const listRegularizations = async (tenantId, filters = {}) => {
  const { status, employeeId } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  if (employeeId) where.employee_id = employeeId;
  return db.AttendanceRegularizationRequest.findAll({
    where,
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code', 'manager_id'] }],
    order: [['created_at', 'DESC']],
  });
};

const reviewRegularization = async (tenantId, actorUserId, id, decision, reviewNotes) => {
  const req = await db.AttendanceRegularizationRequest.findOne({ where: { id, tenant_id: tenantId } });
  if (!req) throw ApiError.notFound('Regularization request not found');
  if (req.status !== 'pending') throw ApiError.conflict('This request has already been reviewed');
  if (!['approved', 'rejected'].includes(decision)) throw ApiError.badRequest('decision must be approved or rejected');

  await req.update({ status: decision, reviewed_by: actorUserId, reviewed_at: new Date(), review_notes: reviewNotes || null });

  if (decision === 'approved') {
    await manualUpsert(tenantId, actorUserId, {
      employeeId: req.employee_id,
      attendanceDate: req.attendance_date,
      checkInTime: req.requested_check_in,
      checkOutTime: req.requested_check_out,
      status: 'present',
      notes: 'Regularized',
    });
  }

  return req;
};

module.exports = {
  checkIn, checkOut, getTodayStatus, manualUpsert, setStatusForDate, listAttendance, getMonthlySheet,
  createRegularization, listRegularizations, reviewRegularization,
  WEEKEND_DAYS,
};
