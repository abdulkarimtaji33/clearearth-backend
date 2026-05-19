module.exports = (sequelize, DataTypes) => {
  const FiscalYear = sequelize.define(
    'FiscalYear',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'fiscal_years',
      timestamps: true,
      underscored: true,
    }
  );

  FiscalYear.associate = (models) => {
    FiscalYear.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    FiscalYear.hasMany(models.AccountingPeriod, { foreignKey: 'fiscal_year_id', as: 'periods' });
  };

  return FiscalYear;
};
