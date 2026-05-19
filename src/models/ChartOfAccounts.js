module.exports = (sequelize, DataTypes) => {
  const ChartOfAccounts = sequelize.define(
    'ChartOfAccounts',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      code: { type: DataTypes.STRING(20), allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'asset | liability | equity | revenue | expense',
      },
      sub_type: { type: DataTypes.STRING(40), allowNull: true },
      normal_balance: { type: DataTypes.STRING(6), allowNull: false, comment: 'debit | credit' },
      is_group: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      parent_id: { type: DataTypes.INTEGER, allowNull: true },
      is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'chart_of_accounts',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['tenant_id', 'code'] },
        { fields: ['tenant_id'] },
        { fields: ['type'] },
      ],
    }
  );

  ChartOfAccounts.associate = (models) => {
    ChartOfAccounts.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    ChartOfAccounts.belongsTo(models.ChartOfAccounts, { foreignKey: 'parent_id', as: 'parent' });
    ChartOfAccounts.hasMany(models.ChartOfAccounts, { foreignKey: 'parent_id', as: 'children' });
    ChartOfAccounts.hasMany(models.JournalEntryLine, { foreignKey: 'account_id', as: 'journalLines' });
  };

  return ChartOfAccounts;
};
