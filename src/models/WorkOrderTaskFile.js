module.exports = (sequelize, DataTypes) => {
  const WorkOrderTaskFile = sequelize.define(
    'WorkOrderTaskFile',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      task_id: { type: DataTypes.INTEGER, allowNull: false },
      image_url: { type: DataTypes.STRING(500), allowNull: false },
      original_name: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'work_order_task_files',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  WorkOrderTaskFile.associate = (models) => {
    WorkOrderTaskFile.belongsTo(models.WorkOrderTask, { foreignKey: 'task_id', as: 'task' });
  };

  return WorkOrderTaskFile;
};
