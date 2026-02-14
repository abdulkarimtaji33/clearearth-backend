/**
 * Document Model
 */
const { DOCUMENT_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      document_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      document_type: {
        type: DataTypes.ENUM(...Object.values(DOCUMENT_TYPE)),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      file_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
      },
      mime_type: {
        type: DataTypes.STRING(100),
      },
      reference_type: {
        type: DataTypes.STRING(50),
        comment: 'Client, Deal, Job, Invoice, etc.',
      },
      reference_id: {
        type: DataTypes.INTEGER,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      parent_document_id: {
        type: DataTypes.INTEGER,
        references: { model: 'documents', key: 'id' },
        comment: 'For version control',
      },
      expiry_date: {
        type: DataTypes.DATE,
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      uploaded_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'documents',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['document_number'], unique: true },
        { fields: ['document_type'] },
        { fields: ['reference_type', 'reference_id'] },
        { fields: ['uploaded_by'] },
      ],
    }
  );

  Document.associate = models => {
    Document.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Document.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    Document.belongsTo(models.Document, { foreignKey: 'parent_document_id', as: 'parentDocument' });
    Document.hasMany(models.Document, { foreignKey: 'parent_document_id', as: 'versions' });
  };

  return Document;
};
