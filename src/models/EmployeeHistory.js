/**
 * Employee History Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeHistory = sequelize.define(
    'EmployeeHistory',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      event_type: {
        type: DataTypes.ENUM(
          'joined', 'department_change', 'designation_change', 'manager_change',
          'status_change', 'salary_change', 'promotion', 'transfer', 'other'
        ),
        allowNull: false,
      },
      field_name: { type: DataTypes.STRING(50), allowNull: true },
      old_value: { type: DataTypes.STRING(255), allowNull: true },
      new_value: { type: DataTypes.STRING(255), allowNull: true },
      effective_date: { type: DataTypes.DATEONLY, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
      recorded_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'employee_history',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeHistory.associate = models => {
    EmployeeHistory.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeHistory.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    EmployeeHistory.belongsTo(models.User, { foreignKey: 'recorded_by', as: 'recordedByUser' });
  };

  return EmployeeHistory;
};
