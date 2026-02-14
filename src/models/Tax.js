/**
 * Tax Model
 */
const { VAT_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Tax = sequelize.define(
    'Tax',
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
      type: {
        type: DataTypes.ENUM(...Object.values(VAT_TYPE)),
        allowNull: false,
      },
      rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'taxes',
      indexes: [{ fields: ['tenant_id'] }],
    }
  );

  Tax.associate = models => {
    Tax.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return Tax;
};
