const outboundService = require('../services/outbound.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');
const { departmentOfRequest } = require('../utils/roleAccess');
const db = require('../models');

const actor = (req) => ({ userId: req.user?.id, roleName: req.user?.role?.name || req.user?.roleName });

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, search, status, type, dealId, from, to } = req.query;
  const pagination = getPaginationParams(page, pageSize);
  const result = await outboundService.list(req.tenant.id, { ...pagination, search, status, type, dealId, from, to });
  return ApiResponse.paginated(res, result.rows, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => ApiResponse.success(res, await outboundService.getById(req.tenant.id, req.params.id)));

const update = asyncHandler(async (req, res) => {
  const row = await outboundService.update(req.tenant.id, req.params.id, req.body, actor(req));
  return ApiResponse.success(res, row, 'Outbound saved');
});

const requestDelivery = asyncHandler(async (req, res) => {
  const row = await outboundService.requestDelivery(req.tenant.id, req.params.id, { date: req.body.date, notes: req.body.notes }, actor(req));
  return ApiResponse.success(res, row, 'Delivery date requested');
});

const confirmDelivery = asyncHandler(async (req, res) => ApiResponse.success(res, await outboundService.confirmDelivery(req.tenant.id, req.params.id, actor(req)), 'Delivery date confirmed'));

const requestReschedule = asyncHandler(async (req, res) => ApiResponse.success(res, await outboundService.requestReschedule(req.tenant.id, req.params.id, req.body.note, actor(req)), 'Reschedule requested'));

const getPdf = asyncHandler(async (req, res) => {
  const ob = await outboundService.getById(req.tenant.id, req.params.id);
  const raw = await pdfService.generateGatepassPdf(req.params.id, req.tenant.id);
  if (!raw) return ApiResponse.error(res, 'The gatepass is created when the outbound details are saved', 404);
  const pdfBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (pdfBuffer.length < 100 || !pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF')) {
    return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  }
  const fname = `gatepass-${ob.gatepass_number}.pdf`.replace(/[^\w.-]+/g, '_');
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${fname}"`);
  res.set('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer, 'binary');
});

/** Clients (for sales) and vendors (for disposal / free service) the user can pick on an outbound entry. */
const parties = asyncHandler(async (req, res) => {
  const where = { tenant_id: req.tenant.id, status: 'active' };
  const department = departmentOfRequest(req);
  if (department) where.department = department;
  const [companies, suppliers] = await Promise.all([
    db.Company.findAll({ where, attributes: ['id', 'company_name'], order: [['company_name', 'ASC']], limit: 2000 }),
    db.Supplier.findAll({ where, attributes: ['id', 'company_name'], order: [['company_name', 'ASC']], limit: 2000 }),
  ]);
  return ApiResponse.success(res, { companies, suppliers });
});

module.exports = { parties, list, getById, update, requestDelivery, confirmDelivery, requestReschedule, getPdf };
