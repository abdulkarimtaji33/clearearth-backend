module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define(
    'Certificate',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      certificate_request_id: { type: DataTypes.INTEGER, allowNull: false },
      type: {
        type: DataTypes.ENUM(
          'green_certificate',
          'certificate_of_destruction',
          'certificate_of_data_destruction',
          'carbon_footprint',
          'destruction_report_evidence'
        ),
        allowNull: false,
      },
      certificate_number: { type: DataTypes.STRING(60), allowNull: false },
      issued_date: { type: DataTypes.DATEONLY, allowNull: true },
      pdf_path: { type: DataTypes.STRING(500), allowNull: true },
      generated_by: { type: DataTypes.INTEGER, allowNull: true },
      co2_saved: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      liters_saved: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      kg_saved: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    },
    {
      tableName: 'certificates',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ unique: true, fields: ['tenant_id', 'certificate_number'] }],
    }
  );

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Certificate.belongsTo(models.CertificateRequest, { foreignKey: 'certificate_request_id', as: 'request' });
    Certificate.belongsTo(models.User, { foreignKey: 'generated_by', as: 'generatedByUser' });
    Certificate.hasMany(models.CertificateItem, { foreignKey: 'certificate_id', as: 'items' });
  };

  return Certificate;
};
