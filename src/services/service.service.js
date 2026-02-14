const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { RECORD_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, category } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { service_code: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const { count, rows } = await db.Service.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { services: rows, total: count };
};

const getById = async (tenantId, serviceId) => {
  const service = await db.Service.findOne({
    where: { id: serviceId, tenant_id: tenantId },
  });
  if (!service) throw ApiError.notFound('Service not found');
  return service;
};

const create = async (tenantId, data) => {
  const serviceCode = generateReferenceNumber('SRV');

  const service = await db.Service.create({
    tenant_id: tenantId,
    service_code: serviceCode,
    name: data.name,
    description: data.description,
    category: data.category,
    unit_of_measure: data.unitOfMeasure || 'service',
    price: data.price || 0,
    tax_rate: data.taxRate || 5,
    status: RECORD_STATUS.PENDING,
  });

  return service;
};

const update = async (tenantId, serviceId, data) => {
  const service = await getById(tenantId, serviceId);

  await service.update({
    name: data.name || service.name,
    description: data.description || service.description,
    category: data.category || service.category,
    unit_of_measure: data.unitOfMeasure || service.unit_of_measure,
    price: data.price ?? service.price,
    tax_rate: data.taxRate ?? service.tax_rate,
  });

  return service;
};

const approve = async (tenantId, serviceId, userId) => {
  const service = await getById(tenantId, serviceId);
  if (service.status !== RECORD_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending services can be approved');
  }

  await service.update({
    status: RECORD_STATUS.ACTIVE,
    approved_by: userId,
    approved_at: new Date(),
  });

  return service;
};

const deactivate = async (tenantId, serviceId) => {
  const service = await getById(tenantId, serviceId);
  await service.update({ status: RECORD_STATUS.INACTIVE });
  return service;
};

const activate = async (tenantId, serviceId) => {
  const service = await getById(tenantId, serviceId);
  await service.update({ status: RECORD_STATUS.ACTIVE });
  return service;
};

const remove = async (tenantId, serviceId) => {
  const service = await getById(tenantId, serviceId);
  await service.destroy();
};

module.exports = { getAll, getById, create, update, approve, deactivate, activate, remove };
