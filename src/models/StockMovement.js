/**
 * Stock Movement Model
 */
const { INVENTORY_TRANSACTION_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define(
    'StockMovement',
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
      lot_id: {
        type: DataTypes.INTEGER,
        references: { model: 'lots', key: 'id' },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      material_type_id: {
        type: DataTypes.INTEGER,
        references: { model: 'material_types', key: 'id' },
      },
      transaction_type: {
        type: DataTypes.ENUM(...Object.values(INVENTORY_TRANSACTION_TYPE)),
        allowNull: false,
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reference_number: {
        type: DataTypes.STRING(100),
      },
      reference_type: {
        type: DataTypes.STRING(50),
        comment: 'GRN, Invoice, Job, Transfer, etc.',
      },
      reference_id: {
        type: DataTypes.INTEGER,
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(15, 2),
      },
      total_cost: {
        type: DataTypes.DECIMAL(15, 2),
      },
      from_warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      to_warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'stock_movements',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['lot_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['transaction_type'] },
        { fields: ['transaction_date'] },
      ],
    }
  );

  StockMovement.associate = models => {
    StockMovement.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    StockMovement.belongsTo(models.Lot, { foreignKey: 'lot_id', as: 'lot' });
    StockMovement.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    StockMovement.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
    StockMovement.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return StockMovement;
};
