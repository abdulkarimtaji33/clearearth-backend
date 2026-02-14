const vehicleService = require('../services/vehicle.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const getAll = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, vehicleType } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await vehicleService.getAll(req.tenant.id, { ...pagination, search, status, vehicleType });
  return ApiResponse.paginated(res, result.vehicles, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getById(req.tenant.id, req.params.id);
  return ApiResponse.success(res, vehicle);
});

const create = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.create(req.tenant.id, req.body);
  return ApiResponse.created(res, vehicle, 'Vehicle created successfully');
});

const update = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.update(req.tenant.id, req.params.id, req.body);
  return ApiResponse.success(res, vehicle, 'Vehicle updated successfully');
});

const updateStatus = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateStatus(req.tenant.id, req.params.id, req.body.status);
  return ApiResponse.success(res, vehicle, 'Vehicle status updated');
});

const addFuelLog = asyncHandler(async (req, res) => {
  const log = await vehicleService.addFuelLog(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, log, 'Fuel log added');
});

const addMaintenanceLog = asyncHandler(async (req, res) => {
  const log = await vehicleService.addMaintenanceLog(req.tenant.id, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, log, 'Maintenance log added');
});

const remove = asyncHandler(async (req, res) => {
  await vehicleService.remove(req.tenant.id, req.params.id);
  return ApiResponse.success(res, null, 'Vehicle deleted');
});

module.exports = { getAll, getById, create, update, updateStatus, addFuelLog, addMaintenanceLog, remove };
