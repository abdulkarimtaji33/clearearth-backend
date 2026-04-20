/**
 * Tax invoice (converted from a proforma invoice)
 */
module.exports = (sequelize, DataTypes) => {
  const TaxInvoice = sequelize.define(
    'TaxInvoice',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      proforma_invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'proforma_invoices', key: 'id' },
      },
      tax_invoice_number: { type: DataTypes.STRING(50), allowNull: false },
      invoice_date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
      subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      vat_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      vat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: null, comment: 'Amount received so far (null = not tracked)' },
      payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unpaid',
        comment: 'unpaid | partial | paid',
      },
      payment_method: { type: DataTypes.STRING(255), allowNull: true },
      reference_no: { type: DataTypes.STRING(255), allowNull: true },
      attachment_path: { type: DataTypes.STRING(500), allowNull: true },
      remarks: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'tax_invoices',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['proforma_invoice_id'] },
        { unique: true, fields: ['tenant_id', 'tax_invoice_number'] },
        { fields: ['payment_status'] },
      ],
    }
  );

  TaxInvoice.associate = models => {
    TaxInvoice.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    TaxInvoice.belongsTo(models.ProformaInvoice, { foreignKey: 'proforma_invoice_id', as: 'proformaInvoice' });
    TaxInvoice.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    TaxInvoice.hasMany(models.TaxInvoiceItem, { foreignKey: 'tax_invoice_id', as: 'items' });
  };

  return TaxInvoice;
};
