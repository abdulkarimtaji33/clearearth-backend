/**
 * Deal Model
 */

module.exports = (sequelize, DataTypes) => {
  const Deal = sequelize.define(
    'Deal',
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
      deal_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      lead_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'leads', key: 'id' },
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
      },
      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'contacts', key: 'id' },
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      deal_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      vat_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5.00,
      },
      vat_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      total: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'draft',
      },
      payment_status: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        defaultValue: 'unpaid',
      },
      paid_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'deals',
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_number'], unique: true },
        { fields: ['lead_id'] },
        { fields: ['company_id'] },
        { fields: ['supplier_id'] },
        { fields: ['status'] },
        { fields: ['payment_status'] },
        { fields: ['assigned_to'] },
      ],
    }
  );

  Deal.associate = models => {
    Deal.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Deal.belongsTo(models.Lead, { foreignKey: 'lead_id', as: 'lead' });
    Deal.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Deal.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
    Deal.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Deal.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Deal.hasMany(models.DealItem, { foreignKey: 'deal_id', as: 'items' });
  };

  return Deal;
};
