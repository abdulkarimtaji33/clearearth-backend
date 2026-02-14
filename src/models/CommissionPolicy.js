/**
 * Commission Policy Model
 */
module.exports = (sequelize, DataTypes) => {
  const CommissionPolicy = sequelize.define(
    'CommissionPolicy',
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
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      applicable_to: {
        type: DataTypes.ENUM('employee', 'agent', 'both'),
        defaultValue: 'employee',
      },
      threshold_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: 'Minimum target before commission eligibility',
      },
      rate_structure: {
        type: DataTypes.JSON,
        comment: 'Tiered rate structure: [{from, to, rate}, ...]',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'commission_policies',
      indexes: [{ fields: ['tenant_id'] }, { fields: ['is_active'] }],
    }
  );

  CommissionPolicy.associate = models => {
    CommissionPolicy.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    CommissionPolicy.hasMany(models.Commission, { foreignKey: 'commission_policy_id', as: 'commissions' });
  };

  return CommissionPolicy;
};
