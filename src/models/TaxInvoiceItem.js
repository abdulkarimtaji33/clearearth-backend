module.exports = (sequelize, DataTypes) => {
  const TaxInvoiceItem = sequelize.define(
    'TaxInvoiceItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tax_invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tax_invoices', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'products_services', key: 'id' },
      },
      description: { type: DataTypes.TEXT },
      quantity: { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 1 },
      unit_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      line_total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unit_of_measure: { type: DataTypes.STRING(100) },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'tax_invoice_items',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tax_invoice_id'] }],
    }
  );

  TaxInvoiceItem.associate = models => {
    TaxInvoiceItem.belongsTo(models.TaxInvoice, { foreignKey: 'tax_invoice_id', as: 'taxInvoice' });
    TaxInvoiceItem.belongsTo(models.ProductService, { foreignKey: 'product_service_id', as: 'productService' });
  };

  return TaxInvoiceItem;
};
