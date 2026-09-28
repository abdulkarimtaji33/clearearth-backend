/**
 * Employee Qualification Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeQualification = sequelize.define(
    'EmployeeQualification',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      degree: { type: DataTypes.STRING(150), allowNull: true },
      institution: { type: DataTypes.STRING(150), allowNull: true },
      year: { type: DataTypes.INTEGER, allowNull: true },
      grade: { type: DataTypes.STRING(50), allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      tableName: 'employee_qualifications',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeQualification.associate = models => {
    EmployeeQualification.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeQualification.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeQualification;
};
