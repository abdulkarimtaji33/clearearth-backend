module.exports = (sequelize, DataTypes) => {
  const PickupNoteItem = sequelize.define(
    'PickupNoteItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      note_id: { type: DataTypes.INTEGER, allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.STRING(500), allowNull: true },
      unit: { type: DataTypes.STRING(30), allowNull: true },
      weight_kg: { type: DataTypes.DECIMAL(14, 3), allowNull: true },
    },
    { tableName: 'pickup_note_items', timestamps: false, paranoid: false, underscored: true }
  );
  return PickupNoteItem;
};
