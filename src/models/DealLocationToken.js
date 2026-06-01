'use strict';

module.exports = (sequelize, DataTypes) => {
  const DealLocationToken = sequelize.define('DealLocationToken', {
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
    deal_id: {
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
    tableName: 'deal_location_tokens',
    underscored: true,
    paranoid: false,
  });

  DealLocationToken.associate = (models) => {
    DealLocationToken.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
  };

  return DealLocationToken;
};
