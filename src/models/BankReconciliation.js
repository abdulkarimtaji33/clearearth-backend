/** BankReconciliation — one statement checked against the ledger for a cash/bank account. */
module.exports = (sequelize, DataTypes) => {
  const BankReconciliation = sequelize.define(
    'BankReconciliation',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: false },
      statement_date: { type: DataTypes.DATEONLY, allowNull: false },
      statement_balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      opening_cleared_balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      cleared_balance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      difference: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'draft', comment: 'draft | completed' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'bank_reconciliations', timestamps: true, paranoid: false, underscored: true }
  );
  BankReconciliation.associate = (models) => {
    BankReconciliation.belongsTo(models.ChartOfAccounts, { foreignKey: 'account_id', as: 'account' });
    BankReconciliation.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };
  return BankReconciliation;
};
