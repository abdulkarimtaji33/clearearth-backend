/**
 * PurchaseOrderItem Model - Line items for Purchase Order
 */
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderItem = sequelize.define(
    'PurchaseOrderItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'purchase_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'products_services', key: 'id' },
      },
      item_description: { type: DataTypes.TEXT },
      quantity: { type: DataTypes.STRING(100), allowNull: false },
      price: { type: DataTypes.STRING(100), allowNull: false },
      total: { type: DataTypes.STRING(100), allowNull: false },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'purchase_order_items',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['purchase_order_id'] }],
    }
  );

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id' });
    PurchaseOrderItem.belongsTo(models.ProductService, { foreignKey: 'product_service_id', as: 'productService' });
  };

  return PurchaseOrderItem;
};
