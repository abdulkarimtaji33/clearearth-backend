/**
 * Payroll Run Model
 */
module.exports = (sequelize, DataTypes) => {
  const PayrollRun = sequelize.define(
    'PayrollRun',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      period_month: { type: DataTypes.TINYINT, allowNull: false },
      period_year: { type: DataTypes.SMALLINT, allowNull: false },
      period_start: { type: DataTypes.DATEONLY, allowNull: false },
      period_end: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.ENUM('draft', 'processed', 'approved', 'paid', 'cancelled'), allowNull: false, defaultValue: 'draft' },
      total_gross: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      total_deductions: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      total_net: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      processed_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      processed_at: { type: DataTypes.DATE, allowNull: true },
      approved_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'payroll_runs',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'period_year', 'period_month'], unique: true }],
    }
  );

  PayrollRun.associate = models => {
    PayrollRun.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    PayrollRun.belongsTo(models.User, { foreignKey: 'processed_by', as: 'processedByUser' });
    PayrollRun.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approvedByUser' });
    PayrollRun.hasMany(models.Payslip, { foreignKey: 'payroll_run_id', as: 'payslips' });
  };

  return PayrollRun;
};
