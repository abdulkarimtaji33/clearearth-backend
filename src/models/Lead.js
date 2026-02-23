/**
 * Lead Model
 */
const { LEAD_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define(
    'Lead',
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
      lead_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        comment: 'Link to company',
      },
      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'contacts', key: 'id' },
        comment: 'Link to contact person',
      },
      email: {
        type: DataTypes.STRING(100),
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      source: {
        type: DataTypes.STRING(100),
        comment: 'Website, Referral, Cold Call, etc.',
      },
      service_interest: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Legacy field, use product_service_id instead',
      },
      product_service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'products_services', key: 'id' },
        comment: 'Link to product/service',
      },
      estimated_value: {
        type: DataTypes.DECIMAL(15, 2),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(LEAD_STATUS)),
        defaultValue: LEAD_STATUS.NEW,
      },
      qualification_notes: {
        type: DataTypes.TEXT,
      },
      disqualification_reason: {
        type: DataTypes.TEXT,
      },
      converted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'leads',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['lead_number'], unique: true },
        { fields: ['assigned_to'] },
        { fields: ['status'] },
      ],
    }
  );

  Lead.associate = models => {
    Lead.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Lead.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Lead.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Lead.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
    Lead.belongsTo(models.ProductService, { foreignKey: 'product_service_id', as: 'productService' });
  };

  return Lead;
};
