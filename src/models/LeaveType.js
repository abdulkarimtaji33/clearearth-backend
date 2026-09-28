/**
 * Leave Type Model
 */
module.exports = (sequelize, DataTypes) => {
  const LeaveType = sequelize.define(
    'LeaveType',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      name: { type: DataTypes.STRING(50), allowNull: false },
      code: { type: DataTypes.STRING(20), allowNull: false },
      is_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      default_annual_days: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      accrual_method: { type: DataTypes.ENUM('annual_lump_sum', 'monthly_accrual', 'none'), allowNull: false, defaultValue: 'annual_lump_sum' },
      requires_approval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'leave_types',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'code'], unique: true }],
    }
  );

  LeaveType.associate = models => {
    LeaveType.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    LeaveType.hasMany(models.LeaveBalance, { foreignKey: 'leave_type_id', as: 'balances' });
    LeaveType.hasMany(models.LeaveRequest, { foreignKey: 'leave_type_id', as: 'requests' });
  };

  return LeaveType;
};
