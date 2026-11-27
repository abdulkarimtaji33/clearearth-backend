/** WarehouseBatch — material received on a GRN line, tracked from receipt to its final outcome. Splits create child batches. */
module.exports = (sequelize, DataTypes) => {
  const WarehouseBatch = sequelize.define(
    'WarehouseBatch',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      batch_code: { type: DataTypes.STRING(60), allowNull: false },
      receipt_code: { type: DataTypes.STRING(60), allowNull: true },
      parent_batch_id: { type: DataTypes.INTEGER, allowNull: true },
      grn_id: { type: DataTypes.INTEGER, allowNull: true },
      grn_item_id: { type: DataTypes.INTEGER, allowNull: true },
      deal_id: { type: DataTypes.INTEGER, allowNull: true },
      customer_name: { type: DataTypes.STRING(255), allowNull: true },
      item_name: { type: DataTypes.STRING(255), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unit_of_measure: { type: DataTypes.STRING(20), allowNull: true },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'inspection_pending' },
      location: { type: DataTypes.STRING(120), allowNull: true },
      handling_category: { type: DataTypes.STRING(40), allowNull: true },
      received_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'warehouse_batches', timestamps: true, paranoid: false, underscored: true }
  );
  WarehouseBatch.associate = (models) => {
    WarehouseBatch.belongsTo(WarehouseBatch, { foreignKey: 'parent_batch_id', as: 'parent' });
    WarehouseBatch.hasMany(WarehouseBatch, { foreignKey: 'parent_batch_id', as: 'children' });
    WarehouseBatch.belongsToMany(models.WarehouseTag, { through: models.WarehouseBatchTag, foreignKey: 'batch_id', otherKey: 'tag_id', as: 'tags' });
    WarehouseBatch.hasMany(models.WarehouseMovement, { foreignKey: 'batch_id', as: 'movements' });
    WarehouseBatch.belongsTo(models.Grn, { foreignKey: 'grn_id', as: 'grn' });
    WarehouseBatch.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
  };
  return WarehouseBatch;
};
