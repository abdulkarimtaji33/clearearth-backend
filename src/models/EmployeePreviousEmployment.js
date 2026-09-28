/**
 * Employee Previous Employment Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeePreviousEmployment = sequelize.define(
    'EmployeePreviousEmployment',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      company_name: { type: DataTypes.STRING(150), allowNull: true },
      job_title: { type: DataTypes.STRING(150), allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: true },
      end_date: { type: DataTypes.DATEONLY, allowNull: true },
      reason_for_leaving: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'employee_previous_employment',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeePreviousEmployment.associate = models => {
    EmployeePreviousEmployment.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeePreviousEmployment.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeePreviousEmployment;
};
