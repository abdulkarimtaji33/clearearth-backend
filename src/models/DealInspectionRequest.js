/**
 * DealInspectionRequest Model - Inspection request details for deals
 */

module.exports = (sequelize, DataTypes) => {
  const DealInspectionRequest = sequelize.define(
    'DealInspectionRequest',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      material_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gate_pass_requirement: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      service_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      quantity_uom: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      lumpsum_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      safety_tools_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      safety_tools: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of selected safety tool keys',
      },
      supporting_documents: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requested_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('request_submitted', 'team_assigned', 'inspection_completed', 'report_submitted'),
        allowNull: false,
        defaultValue: 'request_submitted',
      },
      priority: {
        type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
      },
      response_status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      responded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'deal_inspection_requests',
      timestamps: true,
      underscored: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['deal_id'] }],
    }
  );

  DealInspectionRequest.associate = models => {
    DealInspectionRequest.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    DealInspectionRequest.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
    DealInspectionRequest.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requestedByUser' });
    DealInspectionRequest.belongsTo(models.User, { foreignKey: 'responded_by', as: 'respondedByUser' });
  };

  return DealInspectionRequest;
};
