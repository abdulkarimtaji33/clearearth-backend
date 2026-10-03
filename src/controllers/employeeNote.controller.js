/**
 * Employee Notes Controller (HR-internal only — never exposed on self-service endpoints)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const list = asyncHandler(async (req, res) => {
  const rows = await db.EmployeeNote.findAll({
    where: { tenant_id: req.tenant.id, employee_id: req.params.employeeId },
    include: [{ model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'] }],
    order: [['id', 'DESC']],
  });
  return ApiResponse.success(res, rows);
});

const create = asyncHandler(async (req, res) => {
  const row = await db.EmployeeNote.create({
    tenant_id: req.tenant.id,
    employee_id: req.params.employeeId,
    note_text: req.body.noteText || null,
    created_by: req.user.id,
  });
  return ApiResponse.created(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await db.EmployeeNote.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id, employee_id: req.params.employeeId } });
  if (!row) throw ApiError.notFound('Note not found');
  await row.update({ note_text: req.body.noteText !== undefined ? req.body.noteText : row.note_text });
  return ApiResponse.success(res, row);
});

const remove = asyncHandler(async (req, res) => {
  const row = await db.EmployeeNote.findOne({ where: { id: req.params.id, tenant_id: req.tenant.id, employee_id: req.params.employeeId } });
  if (!row) throw ApiError.notFound('Note not found');
  await row.destroy();
  return ApiResponse.success(res, null, 'Deleted successfully');
});

module.exports = { list, create, update, remove };
