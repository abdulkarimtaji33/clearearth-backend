/**
 * WorkOrder Model - A work order linked to a deal, containing multiple tasks
 */
module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define(
    'WorkOrder',
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
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
      },
      quotation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'quotations', key: 'id' },
        comment: 'Service quotation this work order was created from (at most one WO per quotation)',
      },
      purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'purchase_orders', key: 'id' },
        comment: 'Purchase order this work order was created from (at most one WO per purchase order)',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('new', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'new',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'work_orders',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_id'] },
        { fields: ['quotation_id'], unique: true },
        { fields: ['purchase_order_id'], unique: true },
        { fields: ['status'] },
      ],
    }
  );

  WorkOrder.associate = models => {
    WorkOrder.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    WorkOrder.belongsTo(models.Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
    WorkOrder.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'sourcePurchaseOrder' });
    WorkOrder.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    WorkOrder.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    WorkOrder.hasMany(models.WorkOrderTask, { foreignKey: 'work_order_id', as: 'tasks' });
    WorkOrder.hasMany(models.PurchaseOrder, {
      foreignKey: 'work_order_id',
      as: 'purchaseBills',
      scope: { document_type: 'bill' },
    });
  };

  return WorkOrder;
};
