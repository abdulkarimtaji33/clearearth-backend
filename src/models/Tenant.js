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
      name: {
        type: DataTypes.STRING(200),
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
        defaultValue: 'UAE',
      },
      trn_number: {
        type: DataTypes.STRING(50),
        comment: 'Tax Registration Number',
      },
      vat_registration_number: {
        type: DataTypes.STRING(50),
      },
      license_number: {
        type: DataTypes.STRING(100),
      },
      logo: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RECORD_STATUS)),
        defaultValue: RECORD_STATUS.ACTIVE,
      },
      subscription_plan: {
        type: DataTypes.STRING(50),
        defaultValue: 'basic',
      },
      subscription_start_date: {
        type: DataTypes.DATE,
      },
      subscription_end_date: {
        type: DataTypes.DATE,
      },
      settings: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Tenant-specific settings and configurations',
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
