/**
 * Individual payment installment record for receivables, payables, and expenses
 */
module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define(
    'PaymentTransaction',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      source_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'receivable | payable | expense',
      },
      source_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      payment_method: { type: DataTypes.STRING(255), allowNull: true },
      payment_account_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'chart_of_accounts', key: 'id' },
      },
      reference_no: { type: DataTypes.STRING(255), allowNull: true },
      receipt_number: { type: DataTypes.STRING(50), allowNull: true },
      paid_to: { type: DataTypes.STRING(255), allowNull: true },
      received_from: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      paid_at: { type: DataTypes.DATEONLY, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      journal_entry_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'journal_entries', key: 'id' },
        comment: 'Journal entry posted for this payment',
      },
    },
    {
      tableName: 'payment_transactions',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['source_type', 'source_id'] },
        { fields: ['paid_at'] },
      ],
    }
  );

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    PaymentTransaction.belongsTo(models.ChartOfAccounts, { foreignKey: 'payment_account_id', as: 'paymentAccount' });
    PaymentTransaction.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    PaymentTransaction.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
  };

  return PaymentTransaction;
};
