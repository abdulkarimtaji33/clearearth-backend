/** WarehouseMovement — history line: every receipt, tag change, inspection, move, split, processing step, sale or disposal. */
module.exports = (sequelize, DataTypes) => {
  const WarehouseMovement = sequelize.define(
    'WarehouseMovement',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      batch_id: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING(40), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      from_status: { type: DataTypes.STRING(30), allowNull: true },
      to_status: { type: DataTypes.STRING(30), allowNull: true },
      from_location: { type: DataTypes.STRING(120), allowNull: true },
      to_location: { type: DataTypes.STRING(120), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'warehouse_movements', timestamps: true, updatedAt: false, paranoid: false, underscored: true }
  );
  WarehouseMovement.associate = (models) => {
    WarehouseMovement.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };
  return WarehouseMovement;
};
