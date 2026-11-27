/** QuotationCorrectionRequest — accounts asks sales to correct details of an approved quotation before any document is generated from it. */
module.exports = (sequelize, DataTypes) => {
  const QuotationCorrectionRequest = sequelize.define(
    'QuotationCorrectionRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      quotation_id: { type: DataTypes.INTEGER, allowNull: false },
      requested_by: { type: DataTypes.INTEGER, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
      response_note: { type: DataTypes.TEXT, allowNull: true },
      responded_by: { type: DataTypes.INTEGER, allowNull: true },
      responded_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'quotation_correction_requests', timestamps: true, paranoid: false, underscored: true }
  );
  QuotationCorrectionRequest.associate = (models) => {
    QuotationCorrectionRequest.belongsTo(models.Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
    QuotationCorrectionRequest.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requestedByUser' });
    QuotationCorrectionRequest.belongsTo(models.User, { foreignKey: 'responded_by', as: 'respondedByUser' });
  };
  return QuotationCorrectionRequest;
};
