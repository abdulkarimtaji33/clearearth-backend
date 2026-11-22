const reportService = require('../services/pickupReport.service');
const pdfService = require('../services/pdf.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const filtersOf = (q) => ({ from: q.from, to: q.to, status: q.status, driverId: q.driverId, dealId: q.dealId, search: q.search });

const list = asyncHandler(async (req, res) => {
  const pagination = getPaginationParams(req.query.page, req.query.pageSize);
  const result = await reportService.list(req.tenant.id, { ...filtersOf(req.query), ...pagination });
  return ApiResponse.paginated(res, result.rows, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await reportService.exportCsv(req.tenant.id, filtersOf(req.query));
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="pickup-report-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

const notePdf = asyncHandler(async (req, res) => {
  const raw = await pdfService.generatePickupNotePdf(req.params.taskId, req.tenant.id);
  if (!raw) return ApiResponse.error(res, 'Pickup note not found', 404);
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.length < 100 || !buf.toString('ascii', 0, 5).startsWith('%PDF')) return ApiResponse.error(res, 'PDF generation produced invalid output', 500);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="pickup-note-${req.params.taskId}.pdf"`);
  res.set('Content-Length', buf.length);
  res.end(buf, 'binary');
});

module.exports = { list, exportCsv, notePdf };
