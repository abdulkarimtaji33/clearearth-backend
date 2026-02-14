/**
 * Payroll Line Model
 */
module.exports = (sequelize, DataTypes) => {
  const PayrollLine = sequelize.define(
    'PayrollLine',
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
      payroll_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'payrolls', key: 'id' },
      },
      line_type: {
        type: DataTypes.ENUM('earning', 'deduction'),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      reference_type: {
        type: DataTypes.STRING(50),
        comment: 'Commission, Bonus, Overtime, Tax, etc.',
      },
      reference_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'payroll_lines',
      timestamps: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['payroll_id'] },
        { fields: ['line_type'] },
      ],
    }
  );

  PayrollLine.associate = models => {
    PayrollLine.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    PayrollLine.belongsTo(models.Payroll, { foreignKey: 'payroll_id', as: 'payroll' });
  };

  return PayrollLine;
};
