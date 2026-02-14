const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { VEHICLE_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, vehicleType } = filters;
  const where = { tenant_id: tenantId };

  if (search) where[Op.or] = [{ vehicle_number: { [Op.like]: `%${search}%` } }, { registration_number: { [Op.like]: `%${search}%` } }];
  if (status) where.status = status;
  if (vehicleType) where.vehicle_type = vehicleType;

  const { count, rows } = await db.Vehicle.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { vehicles: rows, total: count };
};

const getById = async (tenantId, vehicleId) => {
  const vehicle = await db.Vehicle.findOne({
    where: { id: vehicleId, tenant_id: tenantId },
    include: [
      { model: db.Trip, as: 'trips', limit: 10, order: [['created_at', 'DESC']] },
      { model: db.FuelLog, as: 'fuelLogs', limit: 10, order: [['refuel_date', 'DESC']] },
      { model: db.MaintenanceLog, as: 'maintenanceLogs', limit: 10, order: [['maintenance_date', 'DESC']] },
    ],
  });

  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return vehicle;
};

const create = async (tenantId, data) => {
  const vehicleNumber = generateReferenceNumber('VEH');

  const vehicle = await db.Vehicle.create({
    tenant_id: tenantId,
    vehicle_number: vehicleNumber,
    registration_number: data.registrationNumber,
    vehicle_type: data.vehicleType,
    make: data.make,
    model: data.model,
    year: data.year,
    capacity: data.capacity,
    current_mileage: data.currentMileage || 0,
    purchase_date: data.purchaseDate,
    insurance_expiry: data.insuranceExpiry,
    registration_expiry: data.registrationExpiry,
    status: VEHICLE_STATUS.AVAILABLE,
    notes: data.notes,
  });

  return await getById(tenantId, vehicle.id);
};

const update = async (tenantId, vehicleId, data) => {
  const vehicle = await db.Vehicle.findOne({ where: { id: vehicleId, tenant_id: tenantId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  await vehicle.update({
    registration_number: data.registrationNumber || vehicle.registration_number,
    vehicle_type: data.vehicleType || vehicle.vehicle_type,
    make: data.make || vehicle.make,
    model: data.model || vehicle.model,
    year: data.year || vehicle.year,
    capacity: data.capacity ?? vehicle.capacity,
    current_mileage: data.currentMileage ?? vehicle.current_mileage,
    insurance_expiry: data.insuranceExpiry || vehicle.insurance_expiry,
    registration_expiry: data.registrationExpiry || vehicle.registration_expiry,
    last_service_date: data.lastServiceDate || vehicle.last_service_date,
    next_service_date: data.nextServiceDate || vehicle.next_service_date,
    notes: data.notes || vehicle.notes,
  });

  return await getById(tenantId, vehicleId);
};

const updateStatus = async (tenantId, vehicleId, status) => {
  const vehicle = await db.Vehicle.findOne({ where: { id: vehicleId, tenant_id: tenantId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  await vehicle.update({ status });
  return await getById(tenantId, vehicleId);
};

const addFuelLog = async (tenantId, vehicleId, userId, data) => {
  const vehicle = await db.Vehicle.findOne({ where: { id: vehicleId, tenant_id: tenantId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const fuelLog = await db.FuelLog.create({
    tenant_id: tenantId,
    vehicle_id: vehicleId,
    refuel_date: data.refuelDate || new Date(),
    odometer_reading: data.odometerReading,
    fuel_quantity: data.fuelQuantity,
    fuel_cost: data.fuelCost,
    fuel_station: data.fuelStation,
    recorded_by: userId,
    notes: data.notes,
  });

  // Update vehicle mileage
  if (data.odometerReading) {
    await vehicle.update({ current_mileage: data.odometerReading });
  }

  return fuelLog;
};

const addMaintenanceLog = async (tenantId, vehicleId, userId, data) => {
  const vehicle = await db.Vehicle.findOne({ where: { id: vehicleId, tenant_id: tenantId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const maintenanceLog = await db.MaintenanceLog.create({
    tenant_id: tenantId,
    vehicle_id: vehicleId,
    maintenance_date: data.maintenanceDate || new Date(),
    maintenance_type: data.maintenanceType,
    description: data.description,
    odometer_reading: data.odometerReading,
    cost: data.cost,
    service_provider: data.serviceProvider,
    next_service_date: data.nextServiceDate,
    recorded_by: userId,
    notes: data.notes,
  });

  // Update vehicle
  if (data.odometerReading) {
    await vehicle.update({ current_mileage: data.odometerReading });
  }
  if (data.nextServiceDate) {
    await vehicle.update({ next_service_date: data.nextServiceDate });
  }

  return maintenanceLog;
};

const remove = async (tenantId, vehicleId) => {
  const vehicle = await db.Vehicle.findOne({ where: { id: vehicleId, tenant_id: tenantId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const tripsCount = await db.Trip.count({ where: { tenant_id: tenantId, vehicle_id: vehicleId } });
  if (tripsCount > 0) {
    throw ApiError.badRequest('Cannot delete vehicle with trip history');
  }

  await vehicle.destroy();
};

module.exports = { getAll, getById, create, update, updateStatus, addFuelLog, addMaintenanceLog, remove };
