/**
 * Certificate Template Model
 */
const { CERTIFICATE_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const CertificateTemplate = sequelize.define(
    'CertificateTemplate',
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
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      certificate_type: {
        type: DataTypes.ENUM(...Object.values(CERTIFICATE_TYPE)),
        allowNull: false,
      },
      template_content: {
        type: DataTypes.TEXT,
        comment: 'HTML template with placeholders',
      },
      template_fields: {
        type: DataTypes.JSON,
        comment: 'Dynamic fields configuration',
      },
      header_image: {
        type: DataTypes.STRING(255),
      },
      footer_image: {
        type: DataTypes.STRING(255),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'certificate_templates',
      indexes: [{ fields: ['tenant_id'] }, { fields: ['certificate_type'] }],
    }
  );

  CertificateTemplate.associate = models => {
    CertificateTemplate.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    CertificateTemplate.hasMany(models.Certificate, { foreignKey: 'template_id', as: 'certificates' });
  };

  return CertificateTemplate;
};
