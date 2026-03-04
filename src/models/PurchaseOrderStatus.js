/**
 * PurchaseOrderStatus Model - Dropdown for PO status
 */
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderStatus = sequelize.define(
    'PurchaseOrderStatus',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      value: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      display_name: { type: DataTypes.STRING(100), allowNull: false },
      display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'purchase_order_statuses', timestamps: true, underscored: true }
  );
  return PurchaseOrderStatus;
};
