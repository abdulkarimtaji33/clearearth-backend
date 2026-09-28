/**
 * Payslip Model
 */
module.exports = (sequelize, DataTypes) => {
  const Payslip = sequelize.define(
    'Payslip',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      payroll_run_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'payroll_runs', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      basic_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      housing_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      transport_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      other_allowance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      commission_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      gross_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      days_in_month: { type: DataTypes.SMALLINT, allowNull: false },
      paid_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      unpaid_leave_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      absent_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      proration_deduction: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      other_deductions: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_deductions: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      net_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      payment_status: { type: DataTypes.ENUM('unpaid', 'paid'), allowNull: false, defaultValue: 'unpaid' },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      payment_method: { type: DataTypes.ENUM('bank_transfer', 'cash', 'cheque'), allowNull: true },
      journal_entry_id_accrual: { type: DataTypes.INTEGER, allowNull: true },
      journal_entry_id_payment: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'payslips',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['tenant_id', 'payroll_run_id', 'employee_id'], unique: true },
      ],
    }
  );

  Payslip.associate = models => {
    Payslip.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Payslip.belongsTo(models.PayrollRun, { foreignKey: 'payroll_run_id', as: 'payrollRun' });
    Payslip.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    Payslip.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id_accrual', as: 'accrualJournalEntry' });
    Payslip.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id_payment', as: 'paymentJournalEntry' });
  };

  return Payslip;
};
