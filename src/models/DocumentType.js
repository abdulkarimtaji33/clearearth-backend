/**
 * Document Type Model (system-wide lookup, tenant_id nullable)
 */
module.exports = (sequelize, DataTypes) => {
  const DocumentType = sequelize.define(
    'DocumentType',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      name: { type: DataTypes.STRING(100), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'document_types',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }],
    }
  );

  DocumentType.associate = models => {
    DocumentType.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    DocumentType.hasMany(models.EmployeeDocument, { foreignKey: 'document_type_id', as: 'documents' });
  };

  return DocumentType;
};
