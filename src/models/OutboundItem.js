/** OutboundItem — a line leaving the facility. Seeded from the GRN items, editable. */
module.exports = (sequelize, DataTypes) => {
  const OutboundItem = sequelize.define(
    'OutboundItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      outbound_id: { type: DataTypes.INTEGER, allowNull: false },
      grn_item_id: { type: DataTypes.INTEGER, allowNull: true },
      item_name: { type: DataTypes.STRING(255), allowNull: false },
      material_type_id: { type: DataTypes.INTEGER, allowNull: true },
      unit_of_measure: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'kg' },
      quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unit_value: { type: DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Sale price per unit / Value of Material (VoM) for free-of-cost stock' },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'outbound_items', timestamps: true, paranoid: false, underscored: true }
  );
  OutboundItem.associate = (models) => {
    OutboundItem.belongsTo(models.Outbound, { foreignKey: 'outbound_id', as: 'outbound' });
    OutboundItem.belongsTo(models.GrnItem, { foreignKey: 'grn_item_id', as: 'grnItem' });
    OutboundItem.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
  };
  return OutboundItem;
};
