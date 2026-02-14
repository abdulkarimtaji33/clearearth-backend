/**
 * Audit Log Model
 */
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
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
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.',
      },
      record_id: {
        type: DataTypes.INTEGER,
        comment: 'ID of the affected record',
      },
      old_data: {
        type: DataTypes.JSON,
        comment: 'State before change',
      },
      new_data: {
        type: DataTypes.JSON,
        comment: 'State after change',
      },
      ip_address: {
        type: DataTypes.STRING(45),
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
      request_method: {
        type: DataTypes.STRING(10),
      },
      request_url: {
        type: DataTypes.STRING(255),
      },
    },
    {
      tableName: 'audit_logs',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['user_id'] },
        { fields: ['module'] },
        { fields: ['action'] },
        { fields: ['record_id'] },
        { fields: ['created_at'] },
      ],
    }
  );

  AuditLog.associate = models => {
    AuditLog.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
    });

    AuditLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return AuditLog;
};
