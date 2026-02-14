/**
 * Journal Entry Model
 */
module.exports = (sequelize, DataTypes) => {
  const JournalEntry = sequelize.define(
    'JournalEntry',
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
      journal_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      entry_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reference_type: {
        type: DataTypes.STRING(50),
        comment: 'Invoice, Payment, Manual, etc.',
      },
      reference_id: {
        type: DataTypes.INTEGER,
      },
      description: {
        type: DataTypes.TEXT,
      },
      total_debit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_credit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      is_posted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      posted_at: {
        type: DataTypes.DATE,
      },
      posted_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'journal_entries',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['journal_number'], unique: true },
        { fields: ['entry_date'] },
        { fields: ['is_posted'] },
      ],
    }
  );

  JournalEntry.associate = models => {
    JournalEntry.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    JournalEntry.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    JournalEntry.belongsTo(models.User, { foreignKey: 'posted_by', as: 'poster' });
    JournalEntry.hasMany(models.JournalEntryLine, { foreignKey: 'journal_entry_id', as: 'lines' });
  };

  return JournalEntry;
};
