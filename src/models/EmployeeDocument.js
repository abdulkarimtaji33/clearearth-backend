/**
 * Employee Document Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeDocument = sequelize.define(
    'EmployeeDocument',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      document_type_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'document_types', key: 'id' } },
      document_number: { type: DataTypes.STRING(100), allowNull: true },
      issue_date: { type: DataTypes.DATEONLY, allowNull: true },
      expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'employee_documents',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeDocument.associate = models => {
    EmployeeDocument.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeDocument.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    EmployeeDocument.belongsTo(models.DocumentType, { foreignKey: 'document_type_id', as: 'documentType' });
  };

  return EmployeeDocument;
};
