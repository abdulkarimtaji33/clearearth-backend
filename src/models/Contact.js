/**
 * Contact Model
 */
module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define(
    'Contact',
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
      contact_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
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
      job_title: {
        type: DataTypes.STRING(150),
      },
      department: {
        type: DataTypes.STRING(100),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'contacts',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['contact_code'], unique: true },
        { fields: ['email'] },
        { fields: ['status'] },
      ],
    }
  );

  Contact.associate = models => {
    Contact.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Contact.hasMany(models.CompanyContact, { foreignKey: 'contact_id', as: 'companyLinks' });
    Contact.hasMany(models.SupplierContact, { foreignKey: 'contact_id', as: 'supplierLinks' });
  };

  return Contact;
};
