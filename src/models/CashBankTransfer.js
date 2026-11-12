/** CashBankTransfer — money moved between two cash/bank accounts. Posts Dr to-account / Cr from-account. */
module.exports = (sequelize, DataTypes) => {
  const CashBankTransfer = sequelize.define(
    'CashBankTransfer',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      transfer_number: { type: DataTypes.STRING(30), allowNull: false },
      transfer_date: { type: DataTypes.DATEONLY, allowNull: false },
      from_account_id: { type: DataTypes.INTEGER, allowNull: false },
      to_account_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      reference_no: { type: DataTypes.STRING(100), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'cash_bank_transfers', timestamps: true, paranoid: false, underscored: true }
  );
  CashBankTransfer.associate = (models) => {
    CashBankTransfer.belongsTo(models.ChartOfAccounts, { foreignKey: 'from_account_id', as: 'fromAccount' });
    CashBankTransfer.belongsTo(models.ChartOfAccounts, { foreignKey: 'to_account_id', as: 'toAccount' });
    CashBankTransfer.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };
  return CashBankTransfer;
};
