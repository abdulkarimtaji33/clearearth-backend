module.exports = (sequelize, DataTypes) => {
  const WarehouseBatchTag = sequelize.define(
    'WarehouseBatchTag',
    {
      batch_id: { type: DataTypes.INTEGER, primaryKey: true },
      tag_id: { type: DataTypes.INTEGER, primaryKey: true },
    },
    { tableName: 'warehouse_batch_tags', timestamps: false, underscored: true }
  );
  return WarehouseBatchTag;
};
