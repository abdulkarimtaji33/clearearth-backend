/**
 * DealItem Model
 */

module.exports = (sequelize, DataTypes) => {
  const DealItem = sequelize.define(
    'DealItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
      },
      product_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'products_services', key: 'id' },
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.00,
      },
      unit_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      line_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      unit_of_measure: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'UOM value from units_of_measure catalog (same as products_services.unit_of_measure)',
      },
    },
    {
      tableName: 'deal_items',
      timestamps: true,
      paranoid: false,
      indexes: [
        { fields: ['deal_id'] },
        { fields: ['product_service_id'] },
      ],
    }
  );

  DealItem.associate = models => {
    DealItem.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    DealItem.belongsTo(models.ProductService, { foreignKey: 'product_service_id', as: 'productService' });
  };

  return DealItem;
};
