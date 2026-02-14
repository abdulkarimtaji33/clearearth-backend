/**
 * Invoice Line Model
 */
module.exports = (sequelize, DataTypes) => {
  const InvoiceLine = sequelize.define(
    'InvoiceLine',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'invoices', key: 'id' },
      },
      product_id: {
        type: DataTypes.INTEGER,
        references: { model: 'products', key: 'id' },
      },
      service_id: {
        type: DataTypes.INTEGER,
        references: { model: 'services', key: 'id' },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
      },
      unit_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'invoice_lines',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['invoice_id'] },
        { fields: ['product_id'] },
        { fields: ['service_id'] },
      ],
    }
  );

  InvoiceLine.associate = models => {
    InvoiceLine.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    InvoiceLine.belongsTo(models.Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
    InvoiceLine.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    InvoiceLine.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return InvoiceLine;
};
