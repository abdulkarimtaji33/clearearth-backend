/**
 * Chart of Accounts Model
 */
module.exports = (sequelize, DataTypes) => {
  const ChartOfAccount = sequelize.define(
    'ChartOfAccount',
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
      account_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      account_type: {
        type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
        allowNull: false,
      },
      parent_account_id: {
        type: DataTypes.INTEGER,
        references: { model: 'chart_of_accounts', key: 'id' },
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_system_account: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'chart_of_accounts',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['tenant_id', 'account_code'], unique: true },
        { fields: ['account_type'] },
      ],
    }
  );

  ChartOfAccount.associate = models => {
    ChartOfAccount.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    ChartOfAccount.belongsTo(models.ChartOfAccount, { foreignKey: 'parent_account_id', as: 'parentAccount' });
    ChartOfAccount.hasMany(models.ChartOfAccount, { foreignKey: 'parent_account_id', as: 'subAccounts' });
  };

  return ChartOfAccount;
};
