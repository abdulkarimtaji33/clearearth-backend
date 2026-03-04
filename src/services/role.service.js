const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters = {}) => {
  const { offset, limit, search } = filters;
  const where = {
    [Op.and]: [
      { [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }] },
      ...(search ? [{ name: { [Op.like]: `%${search}%` } }] : []),
    ],
  };

  const { count, rows } = await db.Role.findAndCountAll({
    where,
    include: [{ model: db.Permission, as: 'permissions' }],
    offset,
    limit,
    order: [['tenant_id', 'ASC'], ['created_at', 'DESC']],
    distinct: true,
  });

  return { roles: rows, total: count };
};

const getById = async (tenantId, roleId) => {
  const role = await db.Role.findOne({
    where: {
      id: roleId,
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
    include: [{ model: db.Permission, as: 'permissions' }],
  });

  if (!role) throw ApiError.notFound('Role not found');
  return role;
};

const create = async (tenantId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const existing = await db.Role.findOne({
      where: { tenant_id: tenantId, name: data.name },
      transaction,
    });

    if (existing) throw ApiError.conflict('Role name already exists');

    const displayName = data.displayName || data.display_name || (data.name && data.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    const role = await db.Role.create(
      {
        tenant_id: tenantId,
        name: data.name,
        display_name: displayName || data.name,
        description: data.description,
        is_system_role: false,
        status: 'active',
      },
      { transaction }
    );

    // Assign permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      await role.setPermissions(data.permissions, { transaction });
    }

    await transaction.commit();
    return await getById(tenantId, role.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (tenantId, roleId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const role = await db.Role.findOne({
      where: {
        id: roleId,
        [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
      },
      transaction,
    });

    if (!role) throw ApiError.notFound('Role not found');

    if (role.is_system_role) {
      throw ApiError.badRequest('Cannot modify system role');
    }

    if (data.name && data.name !== role.name) {
      const existing = await db.Role.findOne({
        where: { tenant_id: tenantId, name: data.name },
        transaction,
      });

      if (existing) throw ApiError.conflict('Role name already exists');
    }

    const displayName = data.displayName || data.display_name || (data.name && data.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    await role.update(
      {
        name: data.name || role.name,
        display_name: displayName || role.display_name,
        description: data.description !== undefined ? data.description : role.description,
      },
      { transaction }
    );

    // Update permissions if provided
    if (data.permissions) {
      await role.setPermissions(data.permissions, { transaction });
    }

    await transaction.commit();
    return await getById(tenantId, role.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const remove = async (tenantId, roleId) => {
  const role = await db.Role.findOne({
    where: {
      id: roleId,
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
  });

  if (!role) throw ApiError.notFound('Role not found');

  if (role.is_system_role) {
    throw ApiError.badRequest('Cannot delete system role');
  }

  // Check if role is assigned to users
  const usersCount = await db.User.count({
    where: { tenant_id: tenantId, role_id: roleId },
  });

  if (usersCount > 0) {
    throw ApiError.badRequest('Cannot delete role assigned to users');
  }

  await role.destroy();
};

// Permissions
const getAllPermissions = async () => {
  const permissions = await db.Permission.findAll({
    order: [['module', 'ASC'], ['action', 'ASC']],
  });

  // Group permissions by module
  const grouped = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  return grouped;
};

const assignPermissionsToRole = async (tenantId, roleId, permissionIds) => {
  const role = await db.Role.findOne({
    where: {
      id: roleId,
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
  });

  if (!role) throw ApiError.notFound('Role not found');

  if (role.is_system_role) {
    throw ApiError.badRequest('Cannot modify system role permissions');
  }

  await role.setPermissions(permissionIds);
  return await getById(tenantId, roleId);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getAllPermissions,
  assignPermissionsToRole,
};
