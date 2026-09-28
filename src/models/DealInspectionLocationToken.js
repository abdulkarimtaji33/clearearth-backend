'use strict';

module.exports = (sequelize, DataTypes) => {
  const DealInspectionLocationToken = sequelize.define('DealInspectionLocationToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    inspection_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'deal_inspection_location_tokens',
    underscored: true,
    paranoid: false,
  });

  DealInspectionLocationToken.associate = (models) => {
    DealInspectionLocationToken.belongsTo(models.DealInspectionRequest, { foreignKey: 'inspection_request_id', as: 'inspectionRequest' });
  };

  return DealInspectionLocationToken;
};
