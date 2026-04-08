/**
 * WorkOrderTaskExpense — line items for task expenses (multiple per task)
 */
module.exports = (sequelize, DataTypes) => {
  const WorkOrderTaskExpense = sequelize.define(
    'WorkOrderTaskExpense',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      work_order_task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'work_order_tasks', key: 'id' },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'work_order_task_expenses',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [{ fields: ['work_order_task_id'] }],
    }
  );

  WorkOrderTaskExpense.associate = models => {
    WorkOrderTaskExpense.belongsTo(models.WorkOrderTask, { foreignKey: 'work_order_task_id', as: 'workOrderTask' });
  };

  return WorkOrderTaskExpense;
};
