module.exports = (sequelize, DataTypes) => {
  const CertificateRequest = sequelize.define(
    'CertificateRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      grn_id: { type: DataTypes.INTEGER, allowNull: true },
      deal_id: { type: DataTypes.INTEGER, allowNull: true },
      company_name: { type: DataTypes.STRING(200), allowNull: false },
      contact_person: { type: DataTypes.STRING(150), allowNull: false },
      contact_no: { type: DataTypes.STRING(30), allowNull: false },
      contact_email: { type: DataTypes.STRING(150), allowNull: false },
      collection_date: { type: DataTypes.DATEONLY, allowNull: false },
      grn_no: { type: DataTypes.STRING(50), allowNull: true, comment: 'Free-text fallback when no linked GRN' },
      material_waste_details: { type: DataTypes.TEXT, allowNull: false },
      total_weight_quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      invoice_no: { type: DataTypes.STRING(100), allowNull: true },
      additional_notes: { type: DataTypes.TEXT, allowNull: true },
      destruction_report_variant: {
        type: DataTypes.ENUM('itemized_equipment', 'bulk_material'),
        allowNull: true,
      },
      wds_ref_no: { type: DataTypes.STRING(100), allowNull: true },
      doc_ref: { type: DataTypes.STRING(100), allowNull: true },
      req_no: { type: DataTypes.STRING(100), allowNull: true },
      boe_no: { type: DataTypes.STRING(100), allowNull: true },
      barcode: { type: DataTypes.STRING(100), allowNull: true },
      requested_by: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pending_verification',
        comment: 'pending_verification | verified | generated | issued',
      },
      verified_by: { type: DataTypes.INTEGER, allowNull: true },
      verified_at: { type: DataTypes.DATE, allowNull: true },
      verification_notes: { type: DataTypes.TEXT, allowNull: true },
      material_type_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'certificate_requests',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  CertificateRequest.associate = (models) => {
    CertificateRequest.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    CertificateRequest.belongsTo(models.Grn, { foreignKey: 'grn_id', as: 'grn' });
    CertificateRequest.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    CertificateRequest.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requestedByUser' });
    CertificateRequest.belongsTo(models.User, { foreignKey: 'verified_by', as: 'verifiedByUser' });
    CertificateRequest.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
    CertificateRequest.hasMany(models.CertificateRequestType, { foreignKey: 'certificate_request_id', as: 'types' });
    CertificateRequest.hasMany(models.CertificateRequestAttachment, { foreignKey: 'certificate_request_id', as: 'attachments' });
    CertificateRequest.hasMany(models.Certificate, { foreignKey: 'certificate_request_id', as: 'certificates' });
  };

  return CertificateRequest;
};
