module.exports = (sequelize, DataTypes) => {
  const CertificateRequestType = sequelize.define(
    'CertificateRequestType',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
    },
    {
      tableName: 'certificate_request_types',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  CertificateRequestType.associate = (models) => {
    CertificateRequestType.belongsTo(models.CertificateRequest, { foreignKey: 'certificate_request_id', as: 'request' });
  };

  return CertificateRequestType;
};
