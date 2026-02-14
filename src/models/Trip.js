/**
 * Trip Model
 */
const { TRIP_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define(
    'Trip',
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
      trip_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' },
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
      },
      driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'drivers', key: 'id' },
      },
      pickup_location: {
        type: DataTypes.TEXT,
      },
      delivery_location: {
        type: DataTypes.TEXT,
      },
      scheduled_date: {
        type: DataTypes.DATE,
      },
      start_time: {
        type: DataTypes.DATE,
      },
      end_time: {
        type: DataTypes.DATE,
      },
      start_mileage: {
        type: DataTypes.DECIMAL(10, 2),
      },
      end_mileage: {
        type: DataTypes.DECIMAL(10, 2),
      },
      distance_km: {
        type: DataTypes.DECIMAL(10, 2),
      },
      material_collected: {
        type: DataTypes.DECIMAL(15, 2),
      },
      photos: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TRIP_STATUS)),
        defaultValue: TRIP_STATUS.SCHEDULED,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'trips',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['trip_number'], unique: true },
        { fields: ['job_id'] },
        { fields: ['vehicle_id'] },
        { fields: ['driver_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Trip.associate = models => {
    Trip.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Trip.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
    Trip.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
    Trip.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
  };

  return Trip;
};
