module.exports = (sequelize, DataTypes) => {
  const AccountingPeriod = sequelize.define(
    'AccountingPeriod',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      fiscal_year_id: { type: DataTypes.INTEGER, allowNull: false },
      period_number: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(30), allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
      closed_by: { type: DataTypes.INTEGER, allowNull: true },
      closed_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'accounting_periods',
      timestamps: true,
      underscored: true,
    }
  );

  AccountingPeriod.associate = (models) => {
    AccountingPeriod.belongsTo(models.FiscalYear, { foreignKey: 'fiscal_year_id', as: 'fiscalYear' });
  };

  return AccountingPeriod;
};
