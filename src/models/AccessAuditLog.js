/**
 * Audit trail for roles / permissions / overrides changes.
 */
module.exports = (sequelize, DataTypes) => {
  const AccessAuditLog = sequelize.define(
    'AccessAuditLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: true },
      actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
      actor_name: { type: DataTypes.STRING(200) },
      action: { type: DataTypes.STRING(60), allowNull: false },
      target_type: { type: DataTypes.STRING(30), allowNull: false },
      target_id: { type: DataTypes.INTEGER, allowNull: true },
      target_label: { type: DataTypes.STRING(200) },
      details: { type: DataTypes.TEXT('long') },
    },
    {
      tableName: 'access_audit_logs',
      paranoid: false,
      updatedAt: false,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['target_type', 'target_id'] }],
    }
  );

  return AccessAuditLog;
};
