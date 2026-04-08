/**
 * WorkOrderTask Model - Individual task within a work order
 */
module.exports = (sequelize, DataTypes) => {
  const WorkOrderTask = sequelize.define(
    'WorkOrderTask',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      work_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'work_orders', key: 'id' },
      },
      type_of_work: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Description of the type of work to be done',
      },
      work_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_types', key: 'id' },
      },
      expense: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Estimated or actual expense for this task',
      },
      estimated_duration: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g. "2 hours", "3 days"',
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
        defaultValue: 'not_started',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'work_order_tasks',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['work_order_id'] },
        { fields: ['assigned_to'] },
        { fields: ['work_type_id'] },
      ],
    }
  );

  WorkOrderTask.associate = models => {
    WorkOrderTask.belongsTo(models.WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });
    WorkOrderTask.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    WorkOrderTask.belongsTo(models.WorkType, { foreignKey: 'work_type_id', as: 'workType' });
    WorkOrderTask.hasMany(models.WorkOrderTaskExpense, { foreignKey: 'work_order_task_id', as: 'expenses' });
  };

  return WorkOrderTask;
};
