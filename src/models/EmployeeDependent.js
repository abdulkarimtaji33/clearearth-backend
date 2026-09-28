/**
 * Employee Dependent Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeDependent = sequelize.define(
    'EmployeeDependent',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      name: { type: DataTypes.STRING(150), allowNull: true },
      relationship: { type: DataTypes.STRING(50), allowNull: true },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      id_number: { type: DataTypes.STRING(50), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'employee_dependents',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeDependent.associate = models => {
    EmployeeDependent.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeDependent.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeDependent;
};
