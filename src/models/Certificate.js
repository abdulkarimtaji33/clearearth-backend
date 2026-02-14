/**
 * Certificate Model
 */
const { CERTIFICATE_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define(
    'Certificate',
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
      certificate_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      certificate_type: {
        type: DataTypes.ENUM(...Object.values(CERTIFICATE_TYPE)),
        allowNull: false,
      },
      template_id: {
        type: DataTypes.INTEGER,
        references: { model: 'certificate_templates', key: 'id' },
      },
      job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' },
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      lot_id: {
        type: DataTypes.INTEGER,
        references: { model: 'lots', key: 'id' },
      },
      issue_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiry_date: {
        type: DataTypes.DATE,
      },
      material_description: {
        type: DataTypes.TEXT,
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 2),
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
      },
      service_description: {
        type: DataTypes.TEXT,
      },
      photos: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Evidence photos for destruction certificates',
      },
      certificate_data: {
        type: DataTypes.JSON,
        comment: 'Template-specific data',
      },
      file_path: {
        type: DataTypes.STRING(255),
      },
      qr_code: {
        type: DataTypes.STRING(255),
      },
      issued_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      verified_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      verified_at: {
        type: DataTypes.DATE,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'certificates',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['certificate_number'], unique: true },
        { fields: ['certificate_type'] },
        { fields: ['job_id'] },
        { fields: ['client_id'] },
      ],
    }
  );

  Certificate.associate = models => {
    Certificate.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Certificate.belongsTo(models.CertificateTemplate, { foreignKey: 'template_id', as: 'template' });
    Certificate.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
    Certificate.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Certificate.belongsTo(models.Lot, { foreignKey: 'lot_id', as: 'lot' });
    Certificate.belongsTo(models.User, { foreignKey: 'issued_by', as: 'issuer' });
  };

  return Certificate;
};
