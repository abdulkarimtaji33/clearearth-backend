/**
 * Error Log Model
 *
 * Records genuine server-side errors only (5xx / unexpected exceptions) —
 * see middlewares/errorHandler.js. Operational client errors (401/403/404/
 * validation) are normal application flow and are never written here.
 */
module.exports = (sequelize, DataTypes) => {
  const ErrorLog = sequelize.define(
    'ErrorLog',
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
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      error_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Error class/name, e.g. 'SequelizeDatabaseError'",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      stack: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName: 'error_logs',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['user_id'] },
        { fields: ['status_code'] },
        { fields: ['created_at'] },
      ],
    }
  );

  ErrorLog.associate = models => {
    ErrorLog.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
    });

    ErrorLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return ErrorLog;
};
