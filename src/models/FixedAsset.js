/**
 * Fixed Asset Model
 */
const { ASSET_STATUS, DEPRECIATION_METHOD } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const FixedAsset = sequelize.define(
    'FixedAsset',
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
      asset_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      asset_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      asset_type: {
        type: DataTypes.STRING(100),
        comment: 'Machinery, Vehicle, Container, Equipment, etc.',
      },
      description: {
        type: DataTypes.TEXT,
      },
      purchase_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      purchase_cost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      salvage_value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      useful_life_years: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      depreciation_method: {
        type: DataTypes.ENUM(...Object.values(DEPRECIATION_METHOD)),
        defaultValue: DEPRECIATION_METHOD.STRAIGHT_LINE,
      },
      depreciation_rate: {
        type: DataTypes.DECIMAL(5, 2),
        comment: 'For reducing balance method',
      },
      accumulated_depreciation: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      book_value: {
        type: DataTypes.DECIMAL(15, 2),
      },
      disposal_date: {
        type: DataTypes.DATE,
      },
      disposal_value: {
        type: DataTypes.DECIMAL(15, 2),
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ASSET_STATUS)),
        defaultValue: ASSET_STATUS.ACTIVE,
      },
      location: {
        type: DataTypes.STRING(200),
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'fixed_assets',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['asset_code'], unique: true },
        { fields: ['status'] },
      ],
    }
  );

  FixedAsset.associate = models => {
    FixedAsset.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    FixedAsset.hasMany(models.Depreciation, { foreignKey: 'asset_id', as: 'depreciations' });
  };

  return FixedAsset;
};
