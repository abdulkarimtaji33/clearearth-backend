/**
 * SupplierContact Model - Junction table linking suppliers to contacts with a role/department
 */
module.exports = (sequelize, DataTypes) => {
  const SupplierContact = sequelize.define(
    'SupplierContact',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
      },
      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'contacts', key: 'id' },
      },
      role: {
        type: DataTypes.STRING(100),
        comment: 'e.g. Sales, Finance, HR, Operations',
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'supplier_contacts',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['supplier_id'] },
        { fields: ['contact_id'] },
        { fields: ['supplier_id', 'contact_id'], unique: true },
      ],
    }
  );

  SupplierContact.associate = models => {
    SupplierContact.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    SupplierContact.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
  };

  return SupplierContact;
};
