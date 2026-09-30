/**
 * Employee Asset (IT asset tracking / custody) Service
 *
 * Kept as its own small file rather than folded into
 * employeeChildRecords.service.js so it doesn't collide with concurrent work
 * on that shared file — assets have their own status/return workflow that
 * doesn't fit the generic list/create/update/remove shape used there anyway.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

const FIELD_MAP = {
  assetType: 'asset_type',
  assetName: 'asset_name',
  serialNumber: 'serial_number',
  assignedDate: 'assigned_date',
  conditionNotes: 'condition_notes',
};

const toColumns = (body) => {
  const data = {};
  for (const [key, column] of Object.entries(FIELD_MAP)) {
    if (body[key] !== undefined) data[column] = body[key] === '' ? null : body[key];
  }
  return data;
};

const list = async (tenantId, employeeId) => {
  return db.EmployeeAsset.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId },
    order: [['id', 'DESC']],
  });
};

const create = async (tenantId, employeeId, body) => {
  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');
  return db.EmployeeAsset.create({
    tenant_id: tenantId,
    employee_id: employeeId,
    status: 'assigned',
    ...toColumns(body),
  });
};

const update = async (tenantId, employeeId, id, body) => {
  const row = await db.EmployeeAsset.findOne({ where: { id, tenant_id: tenantId, employee_id: employeeId } });
  if (!row) throw ApiError.notFound('Asset record not found');
  await row.update(toColumns(body));
  return row;
};

const remove = async (tenantId, employeeId, id) => {
  const row = await db.EmployeeAsset.findOne({ where: { id, tenant_id: tenantId, employee_id: employeeId } });
  if (!row) throw ApiError.notFound('Asset record not found');
  await row.destroy();
  return true;
};

const markReturned = async (tenantId, employeeId, id, returnedDate) => {
  const row = await db.EmployeeAsset.findOne({ where: { id, tenant_id: tenantId, employee_id: employeeId } });
  if (!row) throw ApiError.notFound('Asset record not found');
  await row.update({
    status: 'returned',
    returned_date: returnedDate || new Date().toISOString().slice(0, 10),
  });
  return row;
};

module.exports = { list, create, update, remove, markReturned };
