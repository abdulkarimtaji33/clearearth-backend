/**
 * Supplier Model
 */
module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    'Supplier',
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
      supplier_code: {
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
    },
    {
      tableName: 'suppliers',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['supplier_code'], unique: true },
        { fields: ['email'] },
        { fields: ['status'] },
      ],
    }
  );

  Supplier.associate = models => {
    Supplier.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Supplier.belongsTo(models.Contact, { foreignKey: 'primary_contact_id', as: 'primaryContact' });
    Supplier.hasMany(models.SupplierContact, { foreignKey: 'supplier_id', as: 'contactLinks' });
    Supplier.belongsToMany(models.Contact, {
      through: models.SupplierContact,
      foreignKey: 'supplier_id',
      otherKey: 'contact_id',
      as: 'contacts',
    });
  };

  return Supplier;
};
