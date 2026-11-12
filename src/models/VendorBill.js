/**
 * VendorBill — supplier invoice recorded against an approved purchase order.
 * Posting: Dr 2200 Accrued Expenses (+ Dr 1200 Input VAT) / Cr 2000 Accounts Payable.
 */
module.exports = (sequelize, DataTypes) => {
  const VendorBill = sequelize.define(
    'VendorBill',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      bill_number: { type: DataTypes.STRING(30), allowNull: false },
      purchase_order_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'purchase_orders', key: 'id' }, comment: 'Null for a supplier bill entered without a PO' },
      expense_account_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Expense account debited when there is no PO' },
      expense_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Work order expense cleared by this bill' },
      supplier_id: { type: DataTypes.INTEGER, allowNull: true },
      company_id: { type: DataTypes.INTEGER, allowNull: true },
      supplier_invoice_no: { type: DataTypes.STRING(100), allowNull: false },
      supplier_trn: { type: DataTypes.STRING(50), allowNull: true },
      bill_date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Amount excluding VAT; clears the PO accrual' },
      vat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      debit_note_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Total of supplier debit notes' },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open', comment: 'open | partial | paid | void' },
      attachment_path: { type: DataTypes.STRING(500), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'vendor_bills',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['purchase_order_id'] }, { fields: ['status'] }],
    }
  );

  VendorBill.associate = (models) => {
    VendorBill.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
    VendorBill.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    VendorBill.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    VendorBill.belongsTo(models.ChartOfAccounts, { foreignKey: 'expense_account_id', as: 'expenseAccount' });
  };

  return VendorBill;
};
