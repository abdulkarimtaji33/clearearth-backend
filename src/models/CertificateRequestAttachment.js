module.exports = (sequelize, DataTypes) => {
  const CertificateRequestAttachment = sequelize.define(
    'CertificateRequestAttachment',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_request_id: { type: DataTypes.INTEGER, allowNull: false },
      file_path: { type: DataTypes.STRING(500), allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: true },
      file_type: {
        type: DataTypes.ENUM('grn_report', 'wds', 'destruction_photo', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      photo_stage: {
        type: DataTypes.ENUM('arrival', 'destruction_in_progress', 'other'),
        allowNull: true,
      },
    },
    {
      tableName: 'certificate_request_attachments',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  CertificateRequestAttachment.associate = (models) => {
    CertificateRequestAttachment.belongsTo(models.CertificateRequest, { foreignKey: 'certificate_request_id', as: 'request' });
  };

  return CertificateRequestAttachment;
};
