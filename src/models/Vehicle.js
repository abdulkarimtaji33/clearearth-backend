/**
 * Vehicle Model
 */
const { VEHICLE_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    'Vehicle',
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
      vehicle_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      registration_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      vehicle_type: {
        type: DataTypes.STRING(50),
        comment: 'Truck, Van, Container, etc.',
      },
      make: {
        type: DataTypes.STRING(100),
      },
      model: {
        type: DataTypes.STRING(100),
      },
      year: {
        type: DataTypes.INTEGER,
      },
      capacity: {
        type: DataTypes.DECIMAL(10, 2),
        comment: 'Capacity in tons',
      },
      current_mileage: {
        type: DataTypes.DECIMAL(10, 2),
      },
      purchase_date: {
        type: DataTypes.DATE,
      },
      insurance_expiry: {
        type: DataTypes.DATE,
      },
      registration_expiry: {
        type: DataTypes.DATE,
      },
      last_service_date: {
        type: DataTypes.DATE,
      },
      next_service_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(VEHICLE_STATUS)),
        defaultValue: VEHICLE_STATUS.AVAILABLE,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'vehicles',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['vehicle_number'], unique: true },
        { fields: ['registration_number'] },
        { fields: ['status'] },
      ],
    }
  );

  Vehicle.associate = models => {
    Vehicle.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Vehicle.hasMany(models.Trip, { foreignKey: 'vehicle_id', as: 'trips' });
    Vehicle.hasMany(models.FuelLog, { foreignKey: 'vehicle_id', as: 'fuelLogs' });
    Vehicle.hasMany(models.MaintenanceLog, { foreignKey: 'vehicle_id', as: 'maintenanceLogs' });
  };

  return Vehicle;
};
