/**
 * Attendance Regularization Request Model
 */
module.exports = (sequelize, DataTypes) => {
  const AttendanceRegularizationRequest = sequelize.define(
    'AttendanceRegularizationRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
      requested_check_in: { type: DataTypes.DATE, allowNull: true },
      requested_check_out: { type: DataTypes.DATE, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      reviewed_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      review_notes: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'attendance_regularization_requests',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }],
    }
  );

  AttendanceRegularizationRequest.associate = models => {
    AttendanceRegularizationRequest.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    AttendanceRegularizationRequest.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    AttendanceRegularizationRequest.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewedByUser' });
  };

  return AttendanceRegularizationRequest;
};
