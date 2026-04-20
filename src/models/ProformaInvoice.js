/**
 * Proforma invoice (created from a quotation; amounts editable)
 */
module.exports = (sequelize, DataTypes) => {
  const ProformaInvoice = sequelize.define(
    'ProformaInvoice',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      quotation_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'quotations', key: 'id' } },
      deal_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'deals', key: 'id' } },
      proforma_number: { type: DataTypes.STRING(50), allowNull: false },
      invoice_date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
      subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      vat_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      vat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      remarks: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'proforma_invoices',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['quotation_id'] },
        { fields: ['deal_id'] },
        { unique: true, fields: ['tenant_id', 'proforma_number'] },
      ],
    }
  );

  ProformaInvoice.associate = models => {
    ProformaInvoice.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    ProformaInvoice.belongsTo(models.Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
    ProformaInvoice.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    ProformaInvoice.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    ProformaInvoice.hasMany(models.ProformaInvoiceItem, { foreignKey: 'proforma_invoice_id', as: 'items' });
    ProformaInvoice.hasOne(models.TaxInvoice, { foreignKey: 'proforma_invoice_id', as: 'taxInvoice' });
  };

  return ProformaInvoice;
};
