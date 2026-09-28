/**
 * User Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { hashPassword, generateToken } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, roleId, dateFrom, dateTo } = filters;

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
  applyCreatedAtFilter(where, dateFrom, dateTo);

  const { count, rows } = await db.User.findAndCountAll({
    where,
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name', 'display_name'] }],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { users: rows, total: count };
};

const getInspectors = async (tenantId) => {
  const inspectorRoles = await db.Role.findAll({
    where: {
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
      name: { [Op.in]: ['inspection_team', 'inspection'] },
    },
    attributes: ['id'],
  });
  const roleIds = inspectorRoles.map((r) => r.id);
  if (roleIds.length === 0) return [];
  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: { [Op.in]: roleIds }, status: 'active' },
    attributes: ['id', 'first_name', 'last_name', 'email'],
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name'] }],
    order: [['first_name', 'ASC']],
  });
  return users;
};

const getDrivers = async (tenantId) => {
  const driverRole = await db.Role.findOne({
    where: { [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }], name: 'driver' },
    attributes: ['id'],
  });
  if (!driverRole) return [];
  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: driverRole.id, status: 'active' },
    attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name', 'display_name'] }],
    order: [['first_name', 'ASC']],
  });
  return users;
};

const getAssignees = async (tenantId, roleNames) => {
  const where = { tenant_id: tenantId, status: 'active' };
  if (Array.isArray(roleNames) && roleNames.length > 0) {
    const roles = await db.Role.findAll({
      where: {
        [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
        name: { [Op.in]: roleNames },
      },
      attributes: ['id'],
    });
    const roleIds = roles.map((r) => r.id);
    if (roleIds.length === 0) return [];
    where.role_id = { [Op.in]: roleIds };
  }
  const users = await db.User.findAll({
    where,
    attributes: ['id', 'first_name', 'last_name', 'email'],
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name', 'display_name'] }],
    order: [['first_name', 'ASC']],
  });
  return users;
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
  const { email, password, roleId, firstName, lastName, phone, designation, avatar } = data;

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
    designation: designation || null,
    avatar: avatar || null,
    status: 'active',
  });

  return await getById(tenantId, user.id);
};

const update = async (tenantId, userId, data, actor = null) => {
  const user = await getById(tenantId, userId);

  const updateData = {
    first_name: data.firstName ?? user.first_name,
    last_name: data.lastName ?? user.last_name,
    phone: data.phone ?? user.phone,
    status: data.status ?? user.status,
    designation: data.designation !== undefined ? (data.designation || null) : user.designation,
    avatar: data.avatar !== undefined ? (data.avatar || null) : user.avatar,
  };
  if (data.roleId !== undefined) {
    const roleExists = await db.Role.findOne({
      where: {
        id: data.roleId,
        [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
      },
    });
    if (data.roleId && !roleExists) throw ApiError.badRequest('Role not found');
    updateData.role_id = data.roleId || null;
  }

  let emailChanged = false;
  const oldEmail = user.email;
  if (data.email !== undefined && data.email !== user.email) {
    const existingWithEmail = await db.User.findOne({
      where: { tenant_id: tenantId, email: data.email, id: { [Op.ne]: userId } },
    });
    if (existingWithEmail) throw ApiError.conflict('Email already exists');
    updateData.email = data.email;
    emailChanged = true;
  }

  await user.update(updateData);

  if (emailChanged) {
    try {
      await db.AuditLog.create({
        tenant_id: tenantId,
        user_id: actor?.userId || actor?.id || null,
        module: 'users',
        action: 'UPDATE_EMAIL',
        record_id: userId,
        old_data: { email: oldEmail },
        new_data: { email: data.email },
      });
    } catch (e) { /* audit log failures should not block the update */ }
  }

  return await getById(tenantId, userId);
};

const remove = async (tenantId, userId) => {
  const user = await getById(tenantId, userId);
  await user.destroy();
};

const disable = async (tenantId, userId) => {
  const user = await getById(tenantId, userId);
  await user.update({ status: 'suspended' });
  return await getById(tenantId, userId);
};

const enable = async (tenantId, userId) => {
  const user = await getById(tenantId, userId);
  await user.update({ status: 'active' });
  return await getById(tenantId, userId);
};

const impersonate = async (tenantId, adminUserId, targetUserId) => {
  const targetUser = await db.User.findOne({
    where: { id: targetUserId, tenant_id: tenantId },
    include: [{ model: db.Role, as: 'role' }],
  });
  if (!targetUser) throw ApiError.notFound('User not found');
  if (targetUser.status !== 'active') {
    throw ApiError.badRequest('Cannot impersonate an inactive user');
  }

  const accessToken = generateToken({
    userId: targetUser.id,
    tenantId: targetUser.tenant_id,
    email: targetUser.email,
    role: targetUser.role?.name,
    impersonatedBy: adminUserId,
  });

  try {
    await db.AuditLog.create({
      tenant_id: tenantId,
      user_id: adminUserId,
      module: 'users',
      action: 'impersonate_start',
      record_id: targetUser.id,
      old_data: null,
      new_data: { targetUserId: targetUser.id, targetEmail: targetUser.email },
    });
  } catch (e) { /* audit log failures should not block impersonation */ }

  return {
    accessToken,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      firstName: targetUser.first_name,
      lastName: targetUser.last_name,
      role: targetUser.role?.name,
    },
  };
};

const changePassword = async (tenantId, userId, password) => {
  const user = await db.User.findOne({
    where: { id: userId, tenant_id: tenantId },
    include: [{ model: db.Role, as: 'role', attributes: ['id', 'name'] }],
  });
  if (!user) throw ApiError.notFound('User not found');

  const hashedPassword = await hashPassword(password);
  await user.update({ password: hashedPassword });

  return await getById(tenantId, userId);
};

module.exports = { getAll, getInspectors, getDrivers, getAssignees, getById, create, update, remove, changePassword, disable, enable, impersonate };
