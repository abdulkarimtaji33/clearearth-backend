/**
 * Service Model
 */
const { RECORD_STATUS, SERVICE_CATEGORY } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    'Service',
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
      service_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.ENUM(...Object.values(SERVICE_CATEGORY)),
        allowNull: false,
      },
      unit_of_measure: {
        type: DataTypes.STRING(50),
        defaultValue: 'service',
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RECORD_STATUS)),
        defaultValue: RECORD_STATUS.PENDING,
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
      tableName: 'services',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['service_code'], unique: true },
        { fields: ['status'] },
        { fields: ['category'] },
      ],
    }
  );

  Service.associate = models => {
    Service.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return Service;
};
