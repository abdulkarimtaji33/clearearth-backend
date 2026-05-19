module.exports = (sequelize, DataTypes) => {
  const JournalEntryLine = sequelize.define(
    'JournalEntryLine',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: false },
      debit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      credit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.STRING(500), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'journal_entry_lines',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['journal_entry_id'] },
        { fields: ['account_id'] },
      ],
    }
  );

  JournalEntryLine.associate = (models) => {
    JournalEntryLine.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id' });
    JournalEntryLine.belongsTo(models.ChartOfAccounts, { foreignKey: 'account_id', as: 'account' });
  };

  return JournalEntryLine;
};
