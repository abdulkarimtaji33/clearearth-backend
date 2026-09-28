/**
 * Leave Balance Model
 */
module.exports = (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define(
    'LeaveBalance',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      leave_type_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'leave_types', key: 'id' } },
      year: { type: DataTypes.INTEGER, allowNull: false },
      entitled_days: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      accrued_days: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      used_days: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      carried_forward_days: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'leave_balances',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['tenant_id', 'employee_id', 'leave_type_id', 'year'], unique: true },
      ],
    }
  );

  LeaveBalance.associate = models => {
    LeaveBalance.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    LeaveBalance.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    LeaveBalance.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
  };

  return LeaveBalance;
};
