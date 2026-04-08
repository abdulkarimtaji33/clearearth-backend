/**
 * WorkType — tenant-scoped labels for work order task types
 */
module.exports = (sequelize, DataTypes) => {
  const WorkType = sequelize.define(
    'WorkType',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Pre-select this type when creating a new work order',
      },
    },
    {
      tableName: 'work_types',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['tenant_id'] },
        { unique: true, fields: ['tenant_id', 'name'], name: 'uk_work_types_tenant_name' },
      ],
    }
  );

  WorkType.associate = models => {
    WorkType.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    WorkType.hasMany(models.WorkOrderTask, { foreignKey: 'work_type_id', as: 'workOrderTasks' });
  };

  return WorkType;
};
