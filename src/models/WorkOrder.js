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
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'draft',
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
        { fields: ['status'] },
      ],
    }
  );

  WorkOrder.associate = models => {
    WorkOrder.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    WorkOrder.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    WorkOrder.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    WorkOrder.hasMany(models.WorkOrderTask, { foreignKey: 'work_order_id', as: 'tasks' });
  };

  return WorkOrder;
};
