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
  };

  return DealInspectionRequest;
};
