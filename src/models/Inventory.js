/**
 * Inventory Model - Aggregated inventory view
 */
module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    'Inventory',
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
      warehouse_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
      },
      material_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'material_types', key: 'id' },
      },
      total_quantity: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
        defaultValue: 'kg',
      },
      total_value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      last_updated: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'inventory',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['material_type_id'] },
        { fields: ['tenant_id', 'warehouse_id', 'material_type_id'], unique: true },
      ],
    }
  );

  Inventory.associate = models => {
    Inventory.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Inventory.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    Inventory.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
  };

  return Inventory;
};
