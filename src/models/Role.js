/**
 * Role Model
 */
const { RECORD_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tenants',
          key: 'id',
        },
        comment: 'Null for system roles, tenant_id for custom roles',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_system_role: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'System roles cannot be deleted',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RECORD_STATUS)),
        defaultValue: RECORD_STATUS.ACTIVE,
      },
    },
    {
      tableName: 'roles',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['tenant_id', 'name'], unique: true },
        { fields: ['status'] },
      ],
    }
  );

  Role.associate = models => {
    Role.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
    });

    Role.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users',
    });

    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });
  };

  return Role;
};
