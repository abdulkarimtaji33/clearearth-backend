/**
 * CreditNote — corrects or cancels (part of) a posted tax invoice.
 * Posting: Dr 4000 Revenue + Dr 2100 VAT Payable / Cr 1100 Accounts Receivable.
 */
module.exports = (sequelize, DataTypes) => {
  const CreditNote = sequelize.define(
    'CreditNote',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      credit_note_number: { type: DataTypes.STRING(30), allowNull: false },
      tax_invoice_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tax_invoices', key: 'id' } },
      credit_date: { type: DataTypes.DATEONLY, allowNull: false },
      reason: { type: DataTypes.STRING(100), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Amount excluding VAT' },
      vat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'credit_notes',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['tax_invoice_id'] }],
    }
  );

  CreditNote.associate = (models) => {
    CreditNote.belongsTo(models.TaxInvoice, { foreignKey: 'tax_invoice_id', as: 'taxInvoice' });
    CreditNote.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return CreditNote;
};
