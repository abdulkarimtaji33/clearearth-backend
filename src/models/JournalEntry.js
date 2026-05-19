module.exports = (sequelize, DataTypes) => {
  const JournalEntry = sequelize.define(
    'JournalEntry',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      entry_number: { type: DataTypes.STRING(30), allowNull: false },
      entry_date: { type: DataTypes.DATEONLY, allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: false },
      source_type: {
        type: DataTypes.STRING(40),
        allowNull: false,
        comment: 'tax_invoice|payment_received|expense|expense_payment|purchase_order_approved|po_payment|opening_balance|adjustment|manual',
      },
      source_id: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'posted' },
      auto_reverse: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      reverse_date: { type: DataTypes.DATEONLY, allowNull: true },
      reversed_by_id: { type: DataTypes.INTEGER, allowNull: true },
      voided_at: { type: DataTypes.DATE, allowNull: true },
      voided_by: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'journal_entries',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['tenant_id', 'entry_number'] },
        { fields: ['entry_date'] },
        { fields: ['source_type', 'source_id'] },
        { fields: ['status'] },
      ],
    }
  );

  JournalEntry.associate = (models) => {
    JournalEntry.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    JournalEntry.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    JournalEntry.hasMany(models.JournalEntryLine, { foreignKey: 'journal_entry_id', as: 'lines' });
  };

  return JournalEntry;
};
