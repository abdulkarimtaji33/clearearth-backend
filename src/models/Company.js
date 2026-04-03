/**
 * Company Model
 */
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    'Company',
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
      company_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      company_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      primary_contact_id: {
        type: DataTypes.INTEGER,
        references: { model: 'contacts', key: 'id' },
      },
      industry_type: {
        type: DataTypes.STRING(150),
      },
      website: {
        type: DataTypes.STRING(255),
      },
      email: {
        type: DataTypes.STRING(100),
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      country: {
        type: DataTypes.STRING(100),
        defaultValue: 'UAE',
      },
      city: {
        type: DataTypes.STRING(100),
      },
      address: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      type: {
        type: DataTypes.ENUM('individual', 'organization'),
        allowNull: true,
        defaultValue: 'organization',
      },
      vat_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'VAT/TRN number',
      },
      trade_license_file_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      trade_license_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      trade_license_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      trade_license_expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      vat_certificate_file_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      vat_certificate_trn: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'TRN as shown on VAT certificate',
      },
      bank_details_file_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      bank_iban: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'companies',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['company_code'], unique: true },
        { fields: ['email'] },
        { fields: ['status'] },
      ],
    }
  );

  Company.associate = models => {
    Company.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Company.belongsTo(models.Contact, { foreignKey: 'primary_contact_id', as: 'primaryContact' });
    Company.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator', attributes: [] });
    Company.hasMany(models.CompanyContact, { foreignKey: 'company_id', as: 'contactLinks' });
    Company.belongsToMany(models.Contact, {
      through: models.CompanyContact,
      foreignKey: 'company_id',
      otherKey: 'contact_id',
      as: 'contacts',
    });
    Company.hasMany(models.Deal, { foreignKey: 'company_id', as: 'deals' });
  };

  return Company;
};
