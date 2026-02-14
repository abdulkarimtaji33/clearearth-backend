/**
 * Vendor Model
 */
const { RECORD_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    'Vendor',
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
      vendor_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      vendor_type: {
        type: DataTypes.ENUM('individual', 'company'),
        defaultValue: 'company',
      },
      company_name: {
        type: DataTypes.STRING(200),
      },
      first_name: {
        type: DataTypes.STRING(100),
      },
      last_name: {
        type: DataTypes.STRING(100),
      },
      email: {
        type: DataTypes.STRING(100),
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      mobile: {
        type: DataTypes.STRING(20),
      },
      address: {
        type: DataTypes.TEXT,
      },
      city: {
        type: DataTypes.STRING(100),
      },
      state: {
        type: DataTypes.STRING(100),
      },
      country: {
        type: DataTypes.STRING(100),
        defaultValue: 'UAE',
      },
      postal_code: {
        type: DataTypes.STRING(20),
      },
      trn_number: {
        type: DataTypes.STRING(50),
      },
      license_number: {
        type: DataTypes.STRING(100),
      },
      contact_person_name: {
        type: DataTypes.STRING(100),
      },
      contact_person_phone: {
        type: DataTypes.STRING(20),
      },
      contact_person_email: {
        type: DataTypes.STRING(100),
      },
      service_categories: {
        type: DataTypes.JSON,
        defaultValue: [],
        get() {
          const val = this.getDataValue('service_categories');
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try {
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        },
        set(val) {
          if (!val) {
            this.setDataValue('service_categories', []);
          } else if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              this.setDataValue('service_categories', Array.isArray(parsed) ? parsed : []);
            } catch {
              this.setDataValue('service_categories', []);
            }
          } else {
            this.setDataValue('service_categories', Array.isArray(val) ? val : []);
          }
        },
      },
      payment_terms_days: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
      },
      bank_name: {
        type: DataTypes.STRING(100),
      },
      bank_account_number: {
        type: DataTypes.STRING(50),
      },
      bank_iban: {
        type: DataTypes.STRING(50),
      },
      bank_swift_code: {
        type: DataTypes.STRING(20),
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: 'vendors',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['vendor_code'], unique: true },
        { fields: ['email'] },
        { fields: ['status'] },
      ],
    }
  );

  Vendor.associate = models => {
    Vendor.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return Vendor;
};
