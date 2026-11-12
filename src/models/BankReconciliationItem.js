/** BankReconciliationItem — a ledger line ticked off in a reconciliation. */
module.exports = (sequelize, DataTypes) => {
  const BankReconciliationItem = sequelize.define(
    'BankReconciliationItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      reconciliation_id: { type: DataTypes.INTEGER, allowNull: false },
      journal_entry_line_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'debit - credit of the ledger line' },
    },
    { tableName: 'bank_reconciliation_items', timestamps: true, paranoid: false, underscored: true }
  );
  return BankReconciliationItem;
};
