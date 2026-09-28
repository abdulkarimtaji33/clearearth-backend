/**
 * Employee Service (HRM)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const userService = require('./user.service');
// NOTE: leave.service is required lazily (inside create()) to avoid a require-time
// cycle: employee.service -> leave.service -> attendance.service -> employee.service.

/** Tenant-scoped sequential EMP-0001, EMP-0002... generated inside the caller's transaction */
async function nextEmployeeCode(tenantId, transaction) {
  const row = await db.Employee.findOne({
    where: { tenant_id: tenantId },
    attributes: [[db.sequelize.fn('MAX', db.sequelize.col('id')), 'maxId']],
    transaction,
    lock: transaction.LOCK.UPDATE,
    raw: true,
    paranoid: false,
  });
  // Use COUNT rather than MAX(id) to keep the sequence tenant-local and gap-tolerant
  const [[{ cnt }]] = await db.sequelize.query(
    `SELECT COUNT(*) AS cnt FROM employees WHERE tenant_id = ?`,
    { replacements: [tenantId], transaction }
  );
  const seq = (parseInt(cnt, 10) || 0) + 1;
  return `EMP-${String(seq).padStart(4, '0')}`;
}

const EMPLOYEE_INCLUDE = [
  { model: db.Department, as: 'department', attributes: ['id', 'name'], required: false },
  { model: db.Designation, as: 'designation', attributes: ['id', 'value', 'display_name'], required: false },
  { model: db.Employee, as: 'manager', attributes: ['id', 'first_name', 'last_name', 'employee_code'], required: false },
  { model: db.User, as: 'user', attributes: ['id', 'email', 'status'], required: false },
];

const create = async (tenantId, actorUserId, body) => {
  const {
    firstName, lastName, email, phone, departmentId, designationId, managerId,
    employmentType, dateOfJoining, gender, dateOfBirth, nationality, nationalId,
    passportNumber, address, emergencyContactName, emergencyContactPhone,
    bankName, bankAccountNumber, bankIban, notes,
    createLoginAccount, roleId, existingUserId,
  } = body;

  if (!firstName || !lastName) throw ApiError.badRequest('firstName and lastName are required');
  if (!dateOfJoining) throw ApiError.badRequest('dateOfJoining is required');
  if (createLoginAccount === true && existingUserId) {
    throw ApiError.badRequest('createLoginAccount and existingUserId are mutually exclusive');
  }

  // If we're creating a brand-new login, do that FIRST and outside the employee
  // transaction: user.service#create auto-provisions a bare-bones employee record
  // for every new user (Fix 1). We reuse that auto-created employee below and fill
  // in the HR details, rather than creating a second, duplicate employee row for
  // the same user.
  let autoProvisionedEmployeeId = null;
  let userId = null;
  if (createLoginAccount === true) {
    if (!email || !roleId) throw ApiError.badRequest('email and roleId are required to create a login account');
    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const user = await userService.create(tenantId, {
      email, password: tempPassword, roleId, firstName, lastName, phone,
    });
    userId = user.id;
    autoProvisionedEmployeeId = user.employee_id || null;
  }

  let employee;
  await db.sequelize.transaction(async (t) => {
    if (!createLoginAccount && existingUserId) {
      const existingUser = await db.User.findOne({
        where: { id: existingUserId, tenant_id: tenantId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!existingUser) throw ApiError.badRequest('User not found');
      if (existingUser.employee_id) throw ApiError.conflict('This user is already linked to an employee record');
      userId = existingUser.id;
    }

    const employeeData = {
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      department_id: departmentId || null,
      designation_id: designationId || null,
      manager_id: managerId || null,
      employment_type: employmentType || 'full_time',
      date_of_joining: dateOfJoining,
      employment_status: 'active',
      gender: gender || null,
      date_of_birth: dateOfBirth || null,
      nationality: nationality || null,
      national_id: nationalId || null,
      passport_number: passportNumber || null,
      address: address || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      bank_name: bankName || null,
      bank_account_number: bankAccountNumber || null,
      bank_iban: bankIban || null,
      notes: notes || null,
      created_by: actorUserId || null,
    };

    if (autoProvisionedEmployeeId) {
      // Fill in the full HR details on the employee record that user.service#create
      // already auto-provisioned for this new login.
      employee = await db.Employee.findOne({ where: { id: autoProvisionedEmployeeId, tenant_id: tenantId }, transaction: t });
      await employee.update(employeeData, { transaction: t });
    } else {
      const employeeCode = await nextEmployeeCode(tenantId, t);
      employee = await db.Employee.create({
        tenant_id: tenantId,
        user_id: userId,
        employee_code: employeeCode,
        ...employeeData,
      }, { transaction: t });

      if (userId) {
        await db.User.update({ employee_id: employee.id }, { where: { id: userId }, transaction: t });
      }
    }
  });

  // Initialize this year's leave balances from active leave types (best-effort, non-blocking)
  try {
    const leaveService = require('./leave.service');
    await leaveService.initializeBalancesForEmployee(tenantId, employee.id, new Date().getFullYear());
  } catch (e) {
    console.warn('[HR] leave balance initialization skipped:', e.message);
  }

  return getById(tenantId, employee.id);
};

const getById = async (tenantId, id) => {
  const employee = await db.Employee.findOne({
    where: { id, tenant_id: tenantId },
    include: EMPLOYEE_INCLUDE,
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

const getByUserId = async (tenantId, userId) => {
  return db.Employee.findOne({ where: { tenant_id: tenantId, user_id: userId } });
};

const requireEmployeeForUser = async (tenantId, userId) => {
  const employee = await getByUserId(tenantId, userId);
  if (!employee) throw ApiError.notFound('No employee record linked to your account');
  return employee;
};

const list = async (tenantId, filters = {}) => {
  const { offset, limit, search, departmentId, status } = filters;
  const where = { tenant_id: tenantId };
  if (departmentId) where.department_id = departmentId;
  if (status) where.employment_status = status;
  if (search) {
    const s = `%${search}%`;
    where[Op.or] = [
      { first_name: { [Op.like]: s } },
      { last_name: { [Op.like]: s } },
      { employee_code: { [Op.like]: s } },
      { email: { [Op.like]: s } },
    ];
  }

  const total = await db.Employee.count({ where });
  const rows = await db.Employee.findAll({
    where,
    include: EMPLOYEE_INCLUDE,
    offset,
    limit,
    order: [['first_name', 'ASC']],
  });
  return { employees: rows, total };
};

const update = async (tenantId, id, body) => {
  const employee = await getById(tenantId, id);
  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'departmentId', 'designationId', 'managerId',
    'employmentType', 'dateOfJoining', 'employmentStatus', 'gender', 'dateOfBirth', 'nationality',
    'nationalId', 'passportNumber', 'address', 'emergencyContactName', 'emergencyContactPhone',
    'bankName', 'bankAccountNumber', 'bankIban', 'notes',
  ];
  const map = {
    firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
    departmentId: 'department_id', designationId: 'designation_id', managerId: 'manager_id',
    employmentType: 'employment_type', dateOfJoining: 'date_of_joining', employmentStatus: 'employment_status',
    gender: 'gender', dateOfBirth: 'date_of_birth', nationality: 'nationality', nationalId: 'national_id',
    passportNumber: 'passport_number', address: 'address', emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone', bankName: 'bank_name', bankAccountNumber: 'bank_account_number',
    bankIban: 'bank_iban', notes: 'notes',
  };
  for (const f of fields) {
    if (body[f] !== undefined) employee[map[f]] = body[f] || null;
  }

  if (body.userId !== undefined) {
    if (body.userId === null) {
      if (employee.user_id) {
        await db.sequelize.transaction(async (t) => {
          await db.User.update({ employee_id: null }, { where: { id: employee.user_id }, transaction: t });
          employee.user_id = null;
          await employee.save({ transaction: t });
        });
      }
      return getById(tenantId, id);
    }

    if (body.userId !== employee.user_id) {
      await db.sequelize.transaction(async (t) => {
        const targetUser = await db.User.findOne({
          where: { id: body.userId, tenant_id: tenantId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!targetUser) throw ApiError.badRequest('User not found');
        if (targetUser.employee_id && targetUser.employee_id !== employee.id) {
          throw ApiError.conflict('This user is already linked to another employee record');
        }
        employee.user_id = targetUser.id;
        await employee.save({ transaction: t });
        await db.User.update({ employee_id: employee.id }, { where: { id: targetUser.id }, transaction: t });
      });
      return getById(tenantId, id);
    }
  }

  await employee.save();
  return getById(tenantId, id);
};

const offboard = async (tenantId, actorUserId, employeeId, exitDate) => {
  const employee = await getById(tenantId, employeeId);
  if (!exitDate) throw ApiError.badRequest('exitDate is required');

  await db.sequelize.transaction(async (t) => {
    await employee.update({ employment_status: 'exited', date_of_exit: exitDate }, { transaction: t });

    if (employee.user_id) {
      await db.User.update({ status: 'inactive' }, { where: { id: employee.user_id }, transaction: t });
    }

    await db.EmployeeSalaryStructure.update(
      { effective_to: exitDate, is_active: false },
      { where: { tenant_id: tenantId, employee_id: employeeId, is_active: true }, transaction: t }
    );
  });

  return getById(tenantId, employeeId);
};

module.exports = { create, getById, getByUserId, requireEmployeeForUser, list, update, offboard, nextEmployeeCode };
