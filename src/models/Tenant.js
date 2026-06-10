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
        get() {
          const rawValue = this.getDataValue('settings');
          if (rawValue == null || rawValue === '') return {};
          if (typeof rawValue === 'object' && !Array.isArray(rawValue)) return rawValue;
          if (typeof rawValue === 'string') {
            try {
              const parsed = JSON.parse(rawValue);
              if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed;
              }
            } catch {
              /* ignore */
            }
          }
          return {};
        },
        set(value) {
          let normalized = value;
          if (value == null || value === '') {
            normalized = {};
          } else if (typeof value === 'string') {
            try {
              normalized = JSON.parse(value);
            } catch {
              normalized = {};
            }
          }
          if (typeof normalized !== 'object' || normalized === null || Array.isArray(normalized)) {
            normalized = {};
          }
          this.setDataValue('settings', normalized);
        },
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
