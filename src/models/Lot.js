/**
 * Lot Model - Lot-based inventory tracking
 */
const { LOT_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Lot = sequelize.define(
    'Lot',
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
      lot_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' },
      },
      deal_id: {
        type: DataTypes.INTEGER,
        references: { model: 'deals', key: 'id' },
      },
      material_type_id: {
        type: DataTypes.INTEGER,
        references: { model: 'material_types', key: 'id' },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      initial_quantity: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      current_quantity: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
        defaultValue: 'kg',
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      value_of_material: {
        type: DataTypes.DECIMAL(15, 2),
        comment: 'VoM for FoC deals after processing',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(LOT_STATUS)),
        defaultValue: LOT_STATUS.OPEN,
      },
      opened_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      closed_at: {
        type: DataTypes.DATE,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'lots',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['lot_number'], unique: true },
        { fields: ['job_id'] },
        { fields: ['deal_id'] },
        { fields: ['status'] },
        { fields: ['warehouse_id'] },
      ],
    }
  );

  Lot.associate = models => {
    Lot.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Lot.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
    Lot.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Lot.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
    Lot.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    Lot.hasMany(models.StockMovement, { foreignKey: 'lot_id', as: 'movements' });
  };

  return Lot;
};
