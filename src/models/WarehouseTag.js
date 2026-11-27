/** WarehouseTag — label describing material type, condition, handling action or special handling. */
module.exports = (sequelize, DataTypes) => {
  const WarehouseTag = sequelize.define(
    'WarehouseTag',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      tag_group: { type: DataTypes.STRING(20), allowNull: false, comment: 'material_type | condition | action | special' },
      blocks_processing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: 'Material cannot be processed without authorization (e.g. Customer Hold)' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'warehouse_tags', timestamps: true, paranoid: false, underscored: true }
  );
  return WarehouseTag;
};
