/**
 * Employee Salary Structure Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeSalaryStructure = sequelize.define(
    'EmployeeSalaryStructure',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      basic_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      housing_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      transport_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      other_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      commission_eligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      payment_method: { type: DataTypes.ENUM('bank_transfer', 'cash', 'cheque'), allowNull: false, defaultValue: 'bank_transfer' },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'AED' },
      effective_from: { type: DataTypes.DATEONLY, allowNull: false },
      effective_to: { type: DataTypes.DATEONLY, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'employee_salary_structures',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['is_active'] }],
    }
  );

  EmployeeSalaryStructure.associate = models => {
    EmployeeSalaryStructure.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeSalaryStructure.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    EmployeeSalaryStructure.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return EmployeeSalaryStructure;
};
