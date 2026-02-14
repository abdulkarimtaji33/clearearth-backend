/**
 * User Model
 */
const { USER_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id',
        },
        comment: 'Link to employee record if user is an employee',
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      avatar: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM(...Object.values(USER_STATUS)),
        defaultValue: USER_STATUS.ACTIVE,
      },
      last_login_at: {
        type: DataTypes.DATE,
      },
      last_login_ip: {
        type: DataTypes.STRING(45),
      },
      password_reset_token: {
        type: DataTypes.STRING(255),
      },
      password_reset_expires: {
        type: DataTypes.DATE,
      },
      email_verified_at: {
        type: DataTypes.DATE,
      },
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      two_factor_secret: {
        type: DataTypes.STRING(255),
      },
    },
    {
      tableName: 'users',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['tenant_id', 'email'], unique: true },
        { fields: ['tenant_id', 'username'], unique: true },
        { fields: ['role_id'] },
        { fields: ['status'] },
        { fields: ['employee_id'] },
      ],
      defaultScope: {
        attributes: { exclude: ['password', 'password_reset_token', 'two_factor_secret'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
        tenant: tenantId => ({
          where: { tenant_id: tenantId },
        }),
      },
    }
  );

  User.associate = models => {
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
    });

    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });

    User.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee',
    });

    User.hasMany(models.AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs',
    });
  };

  return User;
};
