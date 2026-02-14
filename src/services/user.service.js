/**
 * User Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { hashPassword } = require('../utils/helpers');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, roleId } = filters;

  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;
  if (roleId) where.role_id = roleId;

  const { count, rows } = await db.User.findAndCountAll({
    where,
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name', 'display_name'] }],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { users: rows, total: count };
};

const getById = async (tenantId, userId) => {
  const user = await db.User.findOne({
    where: { id: userId, tenant_id: tenantId },
    include: [{ model: db.Role, as: 'role' }],
  });

  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const create = async (tenantId, data) => {
  const { email, password, roleId, firstName, lastName, phone } = data;

  const existingUser = await db.User.findOne({
    where: { tenant_id: tenantId, email },
  });

  if (existingUser) throw ApiError.conflict('Email already exists');

  const hashedPassword = await hashPassword(password);

  const user = await db.User.create({
    tenant_id: tenantId,
    role_id: roleId,
    username: email.split('@')[0],
    email,
    password: hashedPassword,
    first_name: firstName,
    last_name: lastName,
    phone,
    status: 'active',
  });

  return await getById(tenantId, user.id);
};

const update = async (tenantId, userId, data) => {
  const user = await getById(tenantId, userId);

  await user.update({
    first_name: data.firstName || user.first_name,
    last_name: data.lastName || user.last_name,
    phone: data.phone || user.phone,
    status: data.status || user.status,
  });

  return await getById(tenantId, userId);
};

const remove = async (tenantId, userId) => {
  const user = await getById(tenantId, userId);
  await user.destroy();
};

module.exports = { getAll, getById, create, update, remove };
