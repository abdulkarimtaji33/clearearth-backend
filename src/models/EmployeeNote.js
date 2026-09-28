/**
 * Employee Note Model (HR-internal, never exposed to self-service endpoints)
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeNote = sequelize.define(
    'EmployeeNote',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      note_text: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'employee_notes',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeNote.associate = models => {
    EmployeeNote.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeNote.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    EmployeeNote.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return EmployeeNote;
};
