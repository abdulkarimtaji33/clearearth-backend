/**
 * PurchaseOrder Model
 */
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      deal_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'deals', key: 'id' } },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        comment: 'Client company when quotation is to client (Offer to Purchase primary flow)',
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        comment: 'Vendor when quotation is to supplier (e.g. downstream partner)',
      },
      po_date: { type: DataTypes.DATEONLY, allowNull: false },
      expected_delivery: { type: DataTypes.STRING(255) },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
      payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unpaid',
        comment: 'unpaid | partial | paid',
      },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      tableName: 'purchase_orders',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_id'] },
        { fields: ['supplier_id'] },
        { fields: ['company_id'] },
        { fields: ['status'] },
        { fields: ['payment_status'] },
      ],
    }
  );

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    PurchaseOrder.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    PurchaseOrder.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
    PurchaseOrder.belongsToMany(models.TermsAndConditions, {
      through: models.PurchaseOrderTerm,
      foreignKey: 'purchase_order_id',
      otherKey: 'terms_and_conditions_id',
      as: 'terms',
    });
  };

  return PurchaseOrder;
};
