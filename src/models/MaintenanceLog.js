/**
 * Maintenance Log Model
 */
module.exports = (sequelize, DataTypes) => {
  const MaintenanceLog = sequelize.define(
    'MaintenanceLog',
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
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
      },
      maintenance_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      maintenance_type: {
        type: DataTypes.STRING(100),
        comment: 'Service, Repair, Inspection, etc.',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      odometer_reading: {
        type: DataTypes.DECIMAL(10, 2),
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
      },
      service_provider: {
        type: DataTypes.STRING(200),
      },
      next_service_date: {
        type: DataTypes.DATE,
      },
      recorded_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'maintenance_logs',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['vehicle_id'] },
        { fields: ['maintenance_date'] },
      ],
    }
  );

  MaintenanceLog.associate = models => {
    MaintenanceLog.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    MaintenanceLog.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
    MaintenanceLog.belongsTo(models.User, { foreignKey: 'recorded_by', as: 'recorder' });
  };

  return MaintenanceLog;
};
