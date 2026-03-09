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
        allowNull: true,
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
      designation: {
        type: DataTypes.STRING(150),
        comment: 'Job title or designation',
      },
      job_title: {
        type: DataTypes.STRING(150),
      },
      department: {
        type: DataTypes.STRING(100),
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        comment: 'Optional company association (for client contacts)',
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        comment: 'Optional supplier association (for vendor contacts)',
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      contact_type: {
        type: DataTypes.ENUM('clients', 'vendors'),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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
    Contact.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Contact.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Contact.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator', attributes: [] });
    Contact.hasMany(models.CompanyContact, { foreignKey: 'contact_id', as: 'companyLinks' });
    Contact.hasMany(models.SupplierContact, { foreignKey: 'contact_id', as: 'supplierLinks' });
  };

  return Contact;
};
