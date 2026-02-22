/**
 * CompanyContact Model - Junction table linking companies to contacts with a role/department
 */
module.exports = (sequelize, DataTypes) => {
  const CompanyContact = sequelize.define(
    'CompanyContact',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
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
      tableName: 'company_contacts',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['company_id'] },
        { fields: ['contact_id'] },
        { fields: ['company_id', 'contact_id'], unique: true },
      ],
    }
  );

  CompanyContact.associate = models => {
    CompanyContact.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    CompanyContact.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
  };

  return CompanyContact;
};
