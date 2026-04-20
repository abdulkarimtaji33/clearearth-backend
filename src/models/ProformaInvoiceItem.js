/**
 * Line items for proforma invoice
 */
module.exports = (sequelize, DataTypes) => {
  const ProformaInvoiceItem = sequelize.define(
    'ProformaInvoiceItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      proforma_invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'proforma_invoices', key: 'id' },
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
      tableName: 'proforma_invoice_items',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['proforma_invoice_id'] }],
    }
  );

  ProformaInvoiceItem.associate = models => {
    ProformaInvoiceItem.belongsTo(models.ProformaInvoice, { foreignKey: 'proforma_invoice_id', as: 'proformaInvoice' });
    ProformaInvoiceItem.belongsTo(models.ProductService, { foreignKey: 'product_service_id', as: 'productService' });
  };

  return ProformaInvoiceItem;
};
