/**
 * Payment Mode Model
 */
module.exports = (sequelize, DataTypes) => {
  const PaymentMode = sequelize.define(
    'PaymentMode',
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
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'payment_modes',
      indexes: [{ fields: ['tenant_id'] }],
    }
  );

  PaymentMode.associate = models => {
    PaymentMode.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return PaymentMode;
};
