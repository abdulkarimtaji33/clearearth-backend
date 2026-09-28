/**
 * Department Service (HRM)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const create = async (tenantId, body) => {
  const { name, code, parentId, headEmployeeId, status } = body;
  if (!name || !String(name).trim()) throw ApiError.badRequest('name is required');

  const dup = await db.Department.findOne({ where: { tenant_id: tenantId, name: name.trim() } });
  if (dup) throw ApiError.conflict(`Department '${name}' already exists`);

  if (parentId) {
    const parent = await db.Department.findOne({ where: { id: parentId, tenant_id: tenantId } });
    if (!parent) throw ApiError.badRequest('Parent department not found');
  }

  const dept = await db.Department.create({
    tenant_id: tenantId,
    name: name.trim(),
    code: code || null,
    parent_id: parentId || null,
    head_employee_id: headEmployeeId || null,
    status: status || 'active',
  });
  return dept;
};

const getById = async (tenantId, id) => {
  const dept = await db.Department.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      { model: db.Department, as: 'parent', attributes: ['id', 'name'], required: false },
      { model: db.Employee, as: 'headEmployee', attributes: ['id', 'first_name', 'last_name', 'employee_code'], required: false },
    ],
  });
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

const list = async (tenantId, filters = {}) => {
  const { offset, limit, search, status } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  if (search) where.name = { [Op.like]: `%${search}%` };

  const total = await db.Department.count({ where });
  const rows = await db.Department.findAll({
    where,
    include: [
      { model: db.Department, as: 'parent', attributes: ['id', 'name'], required: false },
      { model: db.Employee, as: 'headEmployee', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    offset,
    limit,
    order: [['name', 'ASC']],
  });
  return { departments: rows, total };
};

const update = async (tenantId, id, body) => {
  const dept = await getById(tenantId, id);
  const { name, code, parentId, headEmployeeId, status } = body;

  if (name !== undefined && name.trim() !== dept.name) {
    const dup = await db.Department.findOne({ where: { tenant_id: tenantId, name: name.trim(), id: { [Op.ne]: id } } });
    if (dup) throw ApiError.conflict(`Department '${name}' already exists`);
    dept.name = name.trim();
  }
  if (code !== undefined) dept.code = code || null;
  if (parentId !== undefined) {
    if (parentId && Number(parentId) === Number(id)) throw ApiError.badRequest('A department cannot be its own parent');
    dept.parent_id = parentId || null;
  }
  if (headEmployeeId !== undefined) dept.head_employee_id = headEmployeeId || null;
  if (status !== undefined) dept.status = status;

  await dept.save();
  return dept;
};

const remove = async (tenantId, id) => {
  const dept = await getById(tenantId, id);
  const empCount = await db.Employee.count({ where: { tenant_id: tenantId, department_id: id } });
  if (empCount > 0) throw ApiError.badRequest('Cannot delete department — it has employees assigned to it');
  await dept.destroy();
  return { deleted: true };
};

module.exports = { create, getById, list, update, remove };
