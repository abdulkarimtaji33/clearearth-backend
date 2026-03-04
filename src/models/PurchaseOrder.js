/**
 * PurchaseOrder Model
 */
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      supplier_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' } },
      po_date: { type: DataTypes.DATEONLY, allowNull: false },
      expected_delivery: { type: DataTypes.STRING(255) },
    },
    {
      tableName: 'purchase_orders',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['supplier_id'] },
      ],
    }
  );

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
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
