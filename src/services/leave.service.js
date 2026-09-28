/**
 * Leave Service (HRM)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const employeeService = require('./employee.service');
const { WEEKEND_DAYS } = require('./attendance.service');

const SCOPED_APPROVER_ROLES = ['sales_manager', 'operations_manager'];

/** True when the approver's role scope is limited to their own direct reports */
function isScopedApprover(user) {
  const roleName = user.role?.name;
  if (!roleName) return true;
  if (roleName === 'super_admin' || roleName === 'hr_manager' || roleName === 'admin' || roleName === 'tenant_admin') return false;
  return SCOPED_APPROVER_ROLES.includes(roleName);
}

async function assertCanActOnEmployee(tenantId, actorUser, targetEmployeeId) {
  if (!isScopedApprover(actorUser)) return; // hr_manager/admin/super_admin bypass
  const approverEmployee = await employeeService.getByUserId(tenantId, actorUser.id);
  if (!approverEmployee) throw ApiError.forbidden('No employee record linked to your account');
  const target = await db.Employee.findOne({ where: { id: targetEmployeeId, tenant_id: tenantId } });
  if (!target || target.manager_id !== approverEmployee.id) {
    throw ApiError.forbidden('You can only act on your direct reports');
  }
}

function countLeaveDays(startDate, endDate, holidayDatesSet) {
  let count = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const dow = cur.getDay();
    const dateStr = cur.toISOString().slice(0, 10);
    if (!WEEKEND_DAYS.includes(dow) && !holidayDatesSet.has(dateStr)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const initializeBalancesForEmployee = async (tenantId, employeeId, year) => {
  const types = await db.LeaveType.findAll({ where: { tenant_id: tenantId, is_active: true } });
  for (const t of types) {
    await db.LeaveBalance.findOrCreate({
      where: { tenant_id: tenantId, employee_id: employeeId, leave_type_id: t.id, year },
      defaults: {
        tenant_id: tenantId, employee_id: employeeId, leave_type_id: t.id, year,
        entitled_days: t.default_annual_days, accrued_days: 0, used_days: 0, carried_forward_days: 0,
      },
    });
  }
};

const createRequest = async (tenantId, actorUserId, body) => {
  const { leaveTypeId, startDate, endDate, reason } = body;
  if (!leaveTypeId || !startDate || !endDate) throw ApiError.badRequest('leaveTypeId, startDate and endDate are required');
  if (new Date(endDate) < new Date(startDate)) throw ApiError.badRequest('endDate cannot be before startDate');

  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  const leaveType = await db.LeaveType.findOne({ where: { id: leaveTypeId, tenant_id: tenantId } });
  if (!leaveType) throw ApiError.badRequest('Leave type not found');

  const holidays = await db.Holiday.findAll({ where: { tenant_id: tenantId, holiday_date: { [Op.between]: [startDate, endDate] } } });
  const holidaySet = new Set(holidays.map((h) => h.holiday_date));
  const daysCount = countLeaveDays(startDate, endDate, holidaySet);
  if (daysCount <= 0) throw ApiError.badRequest('Selected range has no working days');

  if (leaveType.is_paid) {
    const year = new Date(startDate).getFullYear();
    await initializeBalancesForEmployee(tenantId, employee.id, year);
    const balance = await db.LeaveBalance.findOne({ where: { tenant_id: tenantId, employee_id: employee.id, leave_type_id: leaveTypeId, year } });
    const available = parseFloat(balance?.entitled_days || 0) + parseFloat(balance?.accrued_days || 0) - parseFloat(balance?.used_days || 0);
    if (available < daysCount) throw ApiError.badRequest(`Insufficient leave balance: ${available} day(s) available, ${daysCount} requested`);
  }

  return db.LeaveRequest.create({
    tenant_id: tenantId, employee_id: employee.id, leave_type_id: leaveTypeId,
    start_date: startDate, end_date: endDate, days_count: daysCount, reason: reason || null, status: 'pending',
  });
};

const approve = async (tenantId, actorUser, requestId) => {
  const request = await db.LeaveRequest.findOne({ where: { id: requestId, tenant_id: tenantId }, include: [{ model: db.LeaveType, as: 'leaveType' }] });
  if (!request) throw ApiError.notFound('Leave request not found');
  if (request.status !== 'pending') throw ApiError.conflict('Only pending requests can be approved');

  await assertCanActOnEmployee(tenantId, actorUser, request.employee_id);

  const attendanceService = require('./attendance.service');
  const year = new Date(request.start_date).getFullYear();

  await db.sequelize.transaction(async (t) => {
    if (request.leaveType.is_paid) {
      await initializeBalancesForEmployee(tenantId, request.employee_id, year);
      const balance = await db.LeaveBalance.findOne({
        where: { tenant_id: tenantId, employee_id: request.employee_id, leave_type_id: request.leave_type_id, year },
        transaction: t,
      });
      if (balance) {
        await balance.update({ used_days: parseFloat(balance.used_days) + parseFloat(request.days_count) }, { transaction: t });
      }
    }
    await request.update({ status: 'approved', approved_by: actorUser.id, approved_at: new Date() }, { transaction: t });
  });

  // Mark each covered working day as on_leave in attendance (best effort)
  const holidays = await db.Holiday.findAll({ where: { tenant_id: tenantId, holiday_date: { [Op.between]: [request.start_date, request.end_date] } } });
  const holidaySet = new Set(holidays.map((h) => h.holiday_date));
  const cur = new Date(request.start_date);
  const end = new Date(request.end_date);
  while (cur <= end) {
    const dow = cur.getDay();
    const dateStr = cur.toISOString().slice(0, 10);
    if (!WEEKEND_DAYS.includes(dow) && !holidaySet.has(dateStr)) {
      try {
        await attendanceService.setStatusForDate(tenantId, request.employee_id, dateStr, 'on_leave');
      } catch (e) {
        console.warn('[HR] attendance on_leave sync skipped:', e.message);
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  return request;
};

const reject = async (tenantId, actorUser, requestId, rejectionReason) => {
  const request = await db.LeaveRequest.findOne({ where: { id: requestId, tenant_id: tenantId } });
  if (!request) throw ApiError.notFound('Leave request not found');
  if (request.status !== 'pending') throw ApiError.conflict('Only pending requests can be rejected');

  await assertCanActOnEmployee(tenantId, actorUser, request.employee_id);

  await request.update({ status: 'rejected', rejection_reason: rejectionReason || null, approved_by: actorUser.id, approved_at: new Date() });
  return request;
};

const cancel = async (tenantId, actorUserId, requestId) => {
  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  const request = await db.LeaveRequest.findOne({ where: { id: requestId, tenant_id: tenantId, employee_id: employee.id } });
  if (!request) throw ApiError.notFound('Leave request not found');
  if (!['pending', 'approved'].includes(request.status)) throw ApiError.conflict('This request cannot be cancelled');
  await request.update({ status: 'cancelled' });
  return request;
};

function hasHrLeaveAccess(user) {
  const roleName = user.role?.name;
  if (['super_admin', 'hr_manager', 'admin', 'tenant_admin'].includes(roleName)) return true;
  const names = (user.role?.permissions || []).map((p) => p.name);
  return names.includes('hr.leave.read') || names.includes('hr.leave.approve');
}

const list = async (tenantId, actorUser, filters = {}) => {
  const { status, employeeId, mine } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;

  // Employees with no HR visibility can only ever see their own requests, regardless
  // of the flags passed — prevents an unscoped GET /leave/requests from leaking the
  // whole tenant's leave data to a plain employee.
  const forceOwn = !mine && !hasHrLeaveAccess(actorUser) && !isScopedApprover(actorUser);

  if (mine || forceOwn) {
    const employee = await employeeService.requireEmployeeForUser(tenantId, actorUser.id);
    where.employee_id = employee.id;
  } else if (employeeId) {
    where.employee_id = employeeId;
  } else if (isScopedApprover(actorUser)) {
    const approverEmployee = await employeeService.getByUserId(tenantId, actorUser.id);
    const reportIds = approverEmployee
      ? (await db.Employee.findAll({ where: { tenant_id: tenantId, manager_id: approverEmployee.id }, attributes: ['id'] })).map((e) => e.id)
      : [];
    where.employee_id = { [Op.in]: reportIds.length ? reportIds : [0] };
  }

  return db.LeaveRequest.findAll({
    where,
    include: [
      { model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code', 'manager_id'] },
      { model: db.LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'is_paid'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

const getBalances = async (tenantId, employeeId, year) => {
  await initializeBalancesForEmployee(tenantId, employeeId, year);
  return db.LeaveBalance.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId, year },
    include: [{ model: db.LeaveType, as: 'leaveType' }],
  });
};

// -- Leave type / holiday CRUD (HR settings) --------------------------------

const listLeaveTypes = (tenantId) => db.LeaveType.findAll({ where: { tenant_id: tenantId }, order: [['name', 'ASC']] });

const createLeaveType = async (tenantId, body) => {
  const { name, code, isPaid, defaultAnnualDays, accrualMethod, requiresApproval } = body;
  if (!name || !code) throw ApiError.badRequest('name and code are required');
  const dup = await db.LeaveType.findOne({ where: { tenant_id: tenantId, code } });
  if (dup) throw ApiError.conflict(`Leave type code '${code}' already exists`);
  return db.LeaveType.create({
    tenant_id: tenantId, name, code, is_paid: isPaid !== false,
    default_annual_days: defaultAnnualDays || 0, accrual_method: accrualMethod || 'annual_lump_sum',
    requires_approval: requiresApproval !== false, is_active: true,
  });
};

const updateLeaveType = async (tenantId, id, body) => {
  const lt = await db.LeaveType.findOne({ where: { id, tenant_id: tenantId } });
  if (!lt) throw ApiError.notFound('Leave type not found');
  const map = { name: 'name', isPaid: 'is_paid', defaultAnnualDays: 'default_annual_days', accrualMethod: 'accrual_method', requiresApproval: 'requires_approval', isActive: 'is_active' };
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) lt[col] = body[k];
  }
  await lt.save();
  return lt;
};

const listHolidays = (tenantId) => db.Holiday.findAll({ where: { tenant_id: tenantId }, order: [['holiday_date', 'ASC']] });

const createHoliday = async (tenantId, body) => {
  const { name, holidayDate, isRecurring } = body;
  if (!name || !holidayDate) throw ApiError.badRequest('name and holidayDate are required');
  const dup = await db.Holiday.findOne({ where: { tenant_id: tenantId, holiday_date: holidayDate } });
  if (dup) throw ApiError.conflict('A holiday already exists on this date');
  return db.Holiday.create({ tenant_id: tenantId, name, holiday_date: holidayDate, is_recurring: !!isRecurring });
};

const deleteHoliday = async (tenantId, id) => {
  const h = await db.Holiday.findOne({ where: { id, tenant_id: tenantId } });
  if (!h) throw ApiError.notFound('Holiday not found');
  await h.destroy();
  return { deleted: true };
};

module.exports = {
  initializeBalancesForEmployee, createRequest, approve, reject, cancel, list, getBalances,
  listLeaveTypes, createLeaveType, updateLeaveType, listHolidays, createHoliday, deleteHoliday,
  isScopedApprover,
};
