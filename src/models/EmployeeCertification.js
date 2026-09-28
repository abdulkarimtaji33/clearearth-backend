/**
 * Employee Certification Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeCertification = sequelize.define(
    'EmployeeCertification',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      name: { type: DataTypes.STRING(150), allowNull: true },
      issuer: { type: DataTypes.STRING(150), allowNull: true },
      certificate_number: { type: DataTypes.STRING(100), allowNull: true },
      issue_date: { type: DataTypes.DATEONLY, allowNull: true },
      expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      tableName: 'employee_certifications',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeCertification.associate = models => {
    EmployeeCertification.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeCertification.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeCertification;
};
