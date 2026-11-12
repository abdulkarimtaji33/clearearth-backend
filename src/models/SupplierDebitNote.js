/**
 * SupplierDebitNote — what a supplier credits us for a return or overcharge on a bill.
 * Posting: Dr 2000 Accounts Payable / Cr the bill's expense account (+ Cr 1200 Input VAT).
 */
module.exports = (sequelize, DataTypes) => {
  const SupplierDebitNote = sequelize.define(
    'SupplierDebitNote',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      debit_note_number: { type: DataTypes.STRING(30), allowNull: false },
      vendor_bill_id: { type: DataTypes.INTEGER, allowNull: false },
      supplier_id: { type: DataTypes.INTEGER, allowNull: true },
      company_id: { type: DataTypes.INTEGER, allowNull: true },
      note_date: { type: DataTypes.DATEONLY, allowNull: false },
      reason: { type: DataTypes.STRING(100), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Amount excluding VAT' },
      vat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      credit_account_id: { type: DataTypes.INTEGER, allowNull: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'supplier_debit_notes', timestamps: true, paranoid: false, underscored: true }
  );

  SupplierDebitNote.associate = (models) => {
    SupplierDebitNote.belongsTo(models.VendorBill, { foreignKey: 'vendor_bill_id', as: 'vendorBill' });
    SupplierDebitNote.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    SupplierDebitNote.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    SupplierDebitNote.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return SupplierDebitNote;
};
