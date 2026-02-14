/**
 * Payroll Model
 */
const { PAYROLL_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define(
    'Payroll',
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
      payroll_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      pay_period_start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      pay_period_end: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      working_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      present_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      absent_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      overtime_hours: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      basic_salary: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      gross_salary: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_earnings: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_deductions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      net_salary: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PAYROLL_STATUS)),
        defaultValue: PAYROLL_STATUS.DRAFT,
      },
      payment_date: {
        type: DataTypes.DATE,
      },
      payment_method: {
        type: DataTypes.STRING(50),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'payrolls',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['payroll_number'], unique: true },
        { fields: ['employee_id'] },
        { fields: ['pay_period_start', 'pay_period_end'] },
        { fields: ['status'] },
      ],
    }
  );

  Payroll.associate = models => {
    Payroll.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Payroll.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    Payroll.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    Payroll.hasMany(models.PayrollLine, { foreignKey: 'payroll_id', as: 'lines' });
  };

  return Payroll;
};
