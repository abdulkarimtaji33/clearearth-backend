/**
 * Employee Emergency Contact Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeEmergencyContact = sequelize.define(
    'EmployeeEmergencyContact',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      name: { type: DataTypes.STRING(150), allowNull: true },
      relationship: { type: DataTypes.STRING(50), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(150), allowNull: true },
      is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'employee_emergency_contacts',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeEmergencyContact.associate = models => {
    EmployeeEmergencyContact.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeEmergencyContact.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeEmergencyContact;
};
