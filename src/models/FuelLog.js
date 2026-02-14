/**
 * Fuel Log Model
 */
module.exports = (sequelize, DataTypes) => {
  const FuelLog = sequelize.define(
    'FuelLog',
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
      refuel_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      odometer_reading: {
        type: DataTypes.DECIMAL(10, 2),
      },
      fuel_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fuel_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fuel_station: {
        type: DataTypes.STRING(200),
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
      tableName: 'fuel_logs',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['vehicle_id'] },
        { fields: ['refuel_date'] },
      ],
    }
  );

  FuelLog.associate = models => {
    FuelLog.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    FuelLog.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
    FuelLog.belongsTo(models.User, { foreignKey: 'recorded_by', as: 'recorder' });
  };

  return FuelLog;
};
