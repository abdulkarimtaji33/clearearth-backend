/**
 * Employee Service (HRM)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const userService = require('./user.service');
const { tenantToday } = require('../utils/helpers');
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
    passportNumber, passportIssueDate, passportExpiryDate,
    emiratesIdNumber, emiratesIdIssueDate, emiratesIdExpiryDate,
    visaNumber, visaIssueDate, visaExpiryDate,
    labourCardNo, labourCardIssueDate, labourCardExpiryDate,
    address, emergencyContactName, emergencyContactPhone,
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
      passport_issue_date: passportIssueDate || null,
      passport_expiry_date: passportExpiryDate || null,
      emirates_id_number: emiratesIdNumber || null,
      emirates_id_issue_date: emiratesIdIssueDate || null,
      emirates_id_expiry_date: emiratesIdExpiryDate || null,
      visa_number: visaNumber || null,
      visa_issue_date: visaIssueDate || null,
      visa_expiry_date: visaExpiryDate || null,
      labour_card_no: labourCardNo || null,
      labour_card_issue_date: labourCardIssueDate || null,
      labour_card_expiry_date: labourCardExpiryDate || null,
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

// department_id/designation_id/manager_id/employment_status changes are auto-logged to
// employee_history whenever #update actually changes them (see below).
const TRACKED_HISTORY_FIELDS = {
  department_id: 'department_change',
  designation_id: 'designation_change',
  manager_id: 'manager_change',
  employment_status: 'status_change',
};

const update = async (tenantId, id, body, actorUserId = null) => {
  const employee = await getById(tenantId, id);
  const oldTrackedValues = {};
  for (const col of Object.keys(TRACKED_HISTORY_FIELDS)) oldTrackedValues[col] = employee[col];

  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'departmentId', 'designationId', 'managerId',
    'employmentType', 'dateOfJoining', 'employmentStatus', 'gender', 'dateOfBirth', 'nationality',
    'nationalId', 'passportNumber', 'address', 'emergencyContactName', 'emergencyContactPhone',
    'bankName', 'bankAccountNumber', 'bankIban', 'notes',
    // Expanded profile fields
    'profilePhoto', 'middleName', 'preferredName', 'legalFullName', 'maritalStatus', 'religion', 'bloodGroup',
    'personalEmail', 'workEmail', 'personalPhone', 'workPhone',
    'currentAddressLine1', 'currentAddressCity', 'currentAddressEmirate', 'currentAddressCountry', 'currentAddressPostal',
    'permanentAddressLine1', 'permanentAddressCity', 'permanentAddressEmirate', 'permanentAddressCountry', 'permanentAddressPostal',
    'workLocationId', 'probationStart', 'probationEnd', 'confirmationDate',
    'labourCardNo', 'molPersonId', 'wpsPersonCode', 'taxId', 'paymentMethodDetail', 'routingCode',
    'salaryVisibleToEmployee',
  ];
  const map = {
    firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
    departmentId: 'department_id', designationId: 'designation_id', managerId: 'manager_id',
    employmentType: 'employment_type', dateOfJoining: 'date_of_joining', employmentStatus: 'employment_status',
    gender: 'gender', dateOfBirth: 'date_of_birth', nationality: 'nationality', nationalId: 'national_id',
    passportNumber: 'passport_number', address: 'address', emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone', bankName: 'bank_name', bankAccountNumber: 'bank_account_number',
    bankIban: 'bank_iban', notes: 'notes',
    profilePhoto: 'profile_photo', middleName: 'middle_name', preferredName: 'preferred_name', legalFullName: 'legal_full_name',
    maritalStatus: 'marital_status', religion: 'religion', bloodGroup: 'blood_group',
    personalEmail: 'personal_email', workEmail: 'work_email', personalPhone: 'personal_phone', workPhone: 'work_phone',
    currentAddressLine1: 'current_address_line1', currentAddressCity: 'current_address_city',
    currentAddressEmirate: 'current_address_emirate', currentAddressCountry: 'current_address_country', currentAddressPostal: 'current_address_postal',
    permanentAddressLine1: 'permanent_address_line1', permanentAddressCity: 'permanent_address_city',
    permanentAddressEmirate: 'permanent_address_emirate', permanentAddressCountry: 'permanent_address_country', permanentAddressPostal: 'permanent_address_postal',
    workLocationId: 'work_location_id', probationStart: 'probation_start', probationEnd: 'probation_end', confirmationDate: 'confirmation_date',
    labourCardNo: 'labour_card_no', molPersonId: 'mol_person_id', wpsPersonCode: 'wps_person_code', taxId: 'tax_id',
    paymentMethodDetail: 'payment_method_detail', routingCode: 'routing_code', salaryVisibleToEmployee: 'salary_visible_to_employee',
    passportIssueDate: 'passport_issue_date', passportExpiryDate: 'passport_expiry_date',
    emiratesIdNumber: 'emirates_id_number', emiratesIdIssueDate: 'emirates_id_issue_date', emiratesIdExpiryDate: 'emirates_id_expiry_date',
    visaNumber: 'visa_number', visaIssueDate: 'visa_issue_date', visaExpiryDate: 'visa_expiry_date',
    labourCardIssueDate: 'labour_card_issue_date', labourCardExpiryDate: 'labour_card_expiry_date',
  };
  for (const f of fields) {
    if (body[f] !== undefined) {
      employee[map[f]] = (body[f] === '' || body[f] === undefined) ? null : body[f];
    }
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

  await db.sequelize.transaction(async (t) => {
    await employee.save({ transaction: t });
    for (const [col, eventType] of Object.entries(TRACKED_HISTORY_FIELDS)) {
      const newVal = employee[col];
      if (oldTrackedValues[col] !== newVal) {
        await db.EmployeeHistory.create({
          tenant_id: tenantId,
          employee_id: employee.id,
          event_type: eventType,
          field_name: col,
          old_value: oldTrackedValues[col] !== null && oldTrackedValues[col] !== undefined ? String(oldTrackedValues[col]) : null,
          new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
          effective_date: tenantToday(),
          recorded_by: actorUserId || null,
        }, { transaction: t });
      }
    }
  });
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

// -- GET /hr/employees/me enrichment -----------------------------------------

const getMeEnriched = async (tenantId, userId) => {
  const own = await requireEmployeeForUser(tenantId, userId);
  const employee = await db.Employee.findOne({
    where: { id: own.id, tenant_id: tenantId },
    include: [
      { model: db.Department, as: 'department', attributes: ['id', 'name'], required: false },
      { model: db.Designation, as: 'designation', attributes: ['id', 'value', 'display_name'], required: false },
      { model: db.Employee, as: 'manager', attributes: ['id', 'first_name', 'last_name', 'employee_code'], required: false },
      { model: db.WorkLocation, as: 'workLocation', attributes: ['id', 'name'], required: false },
    ],
  });

  const [documentCount, pendingChangeRequestCount] = await Promise.all([
    db.EmployeeDocument.count({ where: { tenant_id: tenantId, employee_id: employee.id } }),
    db.ProfileChangeRequest.count({ where: { tenant_id: tenantId, employee_id: employee.id, status: 'pending' } }),
  ]);

  const result = employee.toJSON();
  result.hasDocuments = documentCount > 0;
  result.documentCount = documentCount;
  result.hasContract = false; // contract table not built yet (future phase)
  result.pendingChangeRequestCount = pendingChangeRequestCount;

  // Salary is only included when salary_visible_to_employee is true; otherwise the
  // salary fields are omitted entirely (not just nulled) and a flag is returned instead.
  if (employee.salary_visible_to_employee) {
    const salaryStructureService = require('./salaryStructure.service');
    const active = await salaryStructureService.getActive(tenantId, employee.id);
    result.salaryVisible = true;
    result.activeSalaryStructure = active || null;
  } else {
    result.salaryVisible = false;
  }

  return result;
};

/** GET /hr/employees/me/salary-history — respects the same salary_visible_to_employee flag */
const getMySalaryHistory = async (tenantId, userId) => {
  const employee = await requireEmployeeForUser(tenantId, userId);
  if (!employee.salary_visible_to_employee) {
    return { salaryVisible: false, history: [] };
  }
  const salaryStructureService = require('./salaryStructure.service');
  const history = await salaryStructureService.history(tenantId, employee.id);
  return { salaryVisible: true, history };
};

// -- Profile change requests --------------------------------------------------
// Higher-risk fields (identity, personal contact info, addresses, bank details) go
// through an HR-approval workflow rather than being directly self-editable, unlike
// the child-record entities (emergency contacts, dependents, etc.) which are lower
// risk personal data and are directly self-editable with no approval step.
const CHANGE_REQUEST_FIELD_MAP = {
  firstName: 'first_name', lastName: 'last_name', preferredName: 'preferred_name', legalFullName: 'legal_full_name',
  personalEmail: 'personal_email', personalPhone: 'personal_phone',
  currentAddressLine1: 'current_address_line1', currentAddressCity: 'current_address_city',
  currentAddressEmirate: 'current_address_emirate', currentAddressCountry: 'current_address_country', currentAddressPostal: 'current_address_postal',
  permanentAddressLine1: 'permanent_address_line1', permanentAddressCity: 'permanent_address_city',
  permanentAddressEmirate: 'permanent_address_emirate', permanentAddressCountry: 'permanent_address_country', permanentAddressPostal: 'permanent_address_postal',
  bankName: 'bank_name', bankAccountNumber: 'bank_account_number', bankIban: 'bank_iban',
};

const createChangeRequest = async (tenantId, userId, body) => {
  const employee = await requireEmployeeForUser(tenantId, userId);
  const { fieldGroup, changes } = body;
  if (!changes || typeof changes !== 'object' || !Object.keys(changes).length) {
    throw ApiError.badRequest('changes is required');
  }
  const built = {};
  for (const key of Object.keys(changes)) {
    const col = CHANGE_REQUEST_FIELD_MAP[key];
    if (!col) throw ApiError.badRequest(`Field not allowed for change request: ${key}`);
    built[key] = { old: employee[col] !== undefined ? employee[col] : null, new: changes[key] };
  }
  const changeRequest = await db.ProfileChangeRequest.create({
    tenant_id: tenantId, employee_id: employee.id, field_group: fieldGroup || null, changes: built, status: 'pending',
  });

  try {
    const notificationService = require('./notification.service');
    await notificationService.notifyProfileChangeRequested(tenantId, employee, changeRequest);
  } catch (e) {
    console.warn('[Notification] profile change requested notification skipped:', e.message);
  }

  return changeRequest;
};

const listMyChangeRequests = async (tenantId, userId) => {
  const employee = await requireEmployeeForUser(tenantId, userId);
  return db.ProfileChangeRequest.findAll({
    where: { tenant_id: tenantId, employee_id: employee.id },
    order: [['created_at', 'DESC']],
  });
};

const listPendingChangeRequests = async (tenantId) => {
  return db.ProfileChangeRequest.findAll({
    where: { tenant_id: tenantId, status: 'pending' },
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code'] }],
    order: [['created_at', 'ASC']],
  });
};

const approveChangeRequest = async (tenantId, actorUserId, id) => {
  const changeRequest = await db.ProfileChangeRequest.findOne({ where: { id, tenant_id: tenantId } });
  if (!changeRequest) throw ApiError.notFound('Change request not found');
  if (changeRequest.status !== 'pending') throw ApiError.conflict('This request has already been reviewed');

  await db.sequelize.transaction(async (t) => {
    const employee = await db.Employee.findOne({
      where: { id: changeRequest.employee_id, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE,
    });
    if (!employee) throw ApiError.notFound('Employee not found');

    const changes = changeRequest.changes || {};
    for (const key of Object.keys(changes)) {
      const col = CHANGE_REQUEST_FIELD_MAP[key];
      if (!col) continue;
      const newVal = changes[key]?.new;
      const oldVal = employee[col];
      employee[col] = newVal === '' ? null : newVal;
      await db.EmployeeHistory.create({
        tenant_id: tenantId,
        employee_id: employee.id,
        event_type: 'other',
        field_name: col,
        old_value: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
        new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
        effective_date: tenantToday(),
        reason: 'Profile change request approved',
        recorded_by: actorUserId,
      }, { transaction: t });
    }
    await employee.save({ transaction: t });
    await changeRequest.update({ status: 'approved', reviewed_by: actorUserId, reviewed_at: new Date() }, { transaction: t });
  });

  const updated = await db.ProfileChangeRequest.findOne({ where: { id, tenant_id: tenantId } });

  try {
    const notificationService = require('./notification.service');
    const employee = await db.Employee.findOne({ where: { id: updated.employee_id, tenant_id: tenantId } });
    await notificationService.notifyProfileChangeReviewed(tenantId, employee, updated, 'approved');
  } catch (e) {
    console.warn('[Notification] profile change approved notification skipped:', e.message);
  }

  return updated;
};

const rejectChangeRequest = async (tenantId, actorUserId, id, rejectionReason) => {
  const changeRequest = await db.ProfileChangeRequest.findOne({ where: { id, tenant_id: tenantId } });
  if (!changeRequest) throw ApiError.notFound('Change request not found');
  if (changeRequest.status !== 'pending') throw ApiError.conflict('This request has already been reviewed');
  await changeRequest.update({
    status: 'rejected', reviewed_by: actorUserId, reviewed_at: new Date(), rejection_reason: rejectionReason || null,
  });

  try {
    const notificationService = require('./notification.service');
    const employee = await db.Employee.findOne({ where: { id: changeRequest.employee_id, tenant_id: tenantId } });
    await notificationService.notifyProfileChangeReviewed(tenantId, employee, changeRequest, 'rejected', rejectionReason);
  } catch (e) {
    console.warn('[Notification] profile change rejected notification skipped:', e.message);
  }

  return changeRequest;
};

/** GET /hr/employees/me/history and GET /hr/employees/:employeeId/history */
const getHistory = async (tenantId, employeeId) => {
  return db.EmployeeHistory.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId },
    order: [['created_at', 'DESC']],
  });
};

module.exports = {
  create, getById, getByUserId, requireEmployeeForUser, list, update, offboard, nextEmployeeCode,
  getMeEnriched, getMySalaryHistory, getHistory,
  createChangeRequest, listMyChangeRequests, listPendingChangeRequests, approveChangeRequest, rejectChangeRequest,
};
