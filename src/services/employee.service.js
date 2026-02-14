const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { EMPLOYEE_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, department } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { employee_code: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (department) where.department = department;

  const { count, rows } = await db.Employee.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { employees: rows, total: count };
};

const getById = async (tenantId, employeeId) => {
  const employee = await db.Employee.findOne({
    where: { id: employeeId, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'user', attributes: ['id', 'email', 'status'] },
      { model: db.Leave, as: 'leaves', limit: 10 },
      { model: db.AssetCustody, as: 'assets', where: { is_returned: false }, required: false },
    ],
  });

  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

const create = async (tenantId, data) => {
  const employeeCode = generateReferenceNumber('EMP');

  if (data.email) {
    const existing = await db.Employee.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const employee = await db.Employee.create({
    tenant_id: tenantId,
    employee_code: employeeCode,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    nationality: data.nationality,
    passport_number: data.passportNumber,
    passport_expiry: data.passportExpiry,
    emirates_id: data.emiratesId,
    emirates_id_expiry: data.emiratesIdExpiry,
    visa_number: data.visaNumber,
    visa_expiry: data.visaExpiry,
    department: data.department,
    designation: data.designation,
    joining_date: data.joiningDate || new Date(),
    basic_salary: data.basicSalary || 0,
    housing_allowance: data.housingAllowance || 0,
    transport_allowance: data.transportAllowance || 0,
    other_allowances: data.otherAllowances || 0,
    bank_name: data.bankName,
    bank_account_number: data.bankAccountNumber,
    bank_iban: data.bankIban,
    emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone,
    photo: data.photo,
    status: EMPLOYEE_STATUS.ACTIVE,
    notes: data.notes,
  });

  return await getById(tenantId, employee.id);
};

const update = async (tenantId, employeeId, data) => {
  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (data.email && data.email !== employee.email) {
    const existing = await db.Employee.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  await employee.update({
    first_name: data.firstName || employee.first_name,
    last_name: data.lastName || employee.last_name,
    email: data.email || employee.email,
    phone: data.phone || employee.phone,
    department: data.department || employee.department,
    designation: data.designation || employee.designation,
    basic_salary: data.basicSalary ?? employee.basic_salary,
    housing_allowance: data.housingAllowance ?? employee.housing_allowance,
    transport_allowance: data.transportAllowance ?? employee.transport_allowance,
    other_allowances: data.otherAllowances ?? employee.other_allowances,
    bank_name: data.bankName || employee.bank_name,
    bank_account_number: data.bankAccountNumber || employee.bank_account_number,
    bank_iban: data.bankIban || employee.bank_iban,
    emergency_contact_name: data.emergencyContactName || employee.emergency_contact_name,
    emergency_contact_phone: data.emergencyContactPhone || employee.emergency_contact_phone,
    notes: data.notes || employee.notes,
  });

  return await getById(tenantId, employeeId);
};

const terminate = async (tenantId, employeeId, leavingDate) => {
  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  await employee.update({
    status: EMPLOYEE_STATUS.TERMINATED,
    leaving_date: leavingDate || new Date(),
  });

  return await getById(tenantId, employeeId);
};

const remove = async (tenantId, employeeId) => {
  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee.status === EMPLOYEE_STATUS.ACTIVE) {
    throw ApiError.badRequest('Cannot delete active employee');
  }

  await employee.destroy();
};

module.exports = { getAll, getById, create, update, terminate, remove };
