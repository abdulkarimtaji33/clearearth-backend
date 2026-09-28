/**
 * Leave Request Model
 */
module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define(
    'LeaveRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      leave_type_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'leave_types', key: 'id' } },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      days_count: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      approved_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      rejection_reason: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'leave_requests',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }],
    }
  );

  LeaveRequest.associate = models => {
    LeaveRequest.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    LeaveRequest.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    LeaveRequest.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
    LeaveRequest.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approvedByUser' });
  };

  return LeaveRequest;
};
