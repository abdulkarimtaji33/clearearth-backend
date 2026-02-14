/**
 * Journal Entry Line Model
 */
module.exports = (sequelize, DataTypes) => {
  const JournalEntryLine = sequelize.define(
    'JournalEntryLine',
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
      journal_entry_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'journal_entries', key: 'id' },
      },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'chart_of_accounts', key: 'id' },
      },
      description: {
        type: DataTypes.TEXT,
      },
      debit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      credit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: 'journal_entry_lines',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['journal_entry_id'] },
        { fields: ['account_id'] },
      ],
    }
  );

  JournalEntryLine.associate = models => {
    JournalEntryLine.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    JournalEntryLine.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
    JournalEntryLine.belongsTo(models.ChartOfAccount, { foreignKey: 'account_id', as: 'account' });
  };

  return JournalEntryLine;
};
