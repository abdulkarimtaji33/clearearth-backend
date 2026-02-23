/**
 * Tenant Model
 */
const { RECORD_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      address: {
        type: DataTypes.TEXT,
      },
      city: {
        type: DataTypes.STRING(100),
      },
      country: {
        type: DataTypes.STRING(100),
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      subscription_plan: {
        type: DataTypes.STRING(50),
      },
      subscription_expires_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'tenants',
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['status'] },
        { fields: ['subscription_end_date'] },
      ],
    }
  );

  Tenant.associate = models => {
    Tenant.hasMany(models.User, {
      foreignKey: 'tenant_id',
      as: 'users',
    });
  };

  return Tenant;
};
