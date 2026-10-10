/**
 * WorkOrderTaskAssignee Model - join table allowing multiple users to be
 * assigned to the same work order task. `WorkOrderTask.assigned_to` is kept
 * as a legacy single-FK column (mirrors the first assignee) for backward
 * compatibility with the driver app and any older reads.
 */
module.exports = (sequelize, DataTypes) => {
  const WorkOrderTaskAssignee = sequelize.define(
    'WorkOrderTaskAssignee',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'work_order_tasks', key: 'id' },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'work_order_task_assignees',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { unique: true, fields: ['task_id', 'user_id'] },
        { fields: ['task_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  WorkOrderTaskAssignee.associate = (models) => {
    WorkOrderTaskAssignee.belongsTo(models.WorkOrderTask, { foreignKey: 'task_id', as: 'task' });
    WorkOrderTaskAssignee.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return WorkOrderTaskAssignee;
};
