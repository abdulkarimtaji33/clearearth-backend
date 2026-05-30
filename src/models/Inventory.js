module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    'Inventory',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      material_type_id: { type: DataTypes.INTEGER, allowNull: false },
      total_quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0 },
      unit_of_measure: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'kg' },
      total_value: { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0 },
      last_updated: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'inventory',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Inventory.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
  };

  return Inventory;
};
