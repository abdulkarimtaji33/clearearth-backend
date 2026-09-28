/**
 * Sales Commission Controller
 */
const { asyncHandler } = require('../middlewares/errorHandler');
const commissionService = require('../services/commission.service');

const setRate = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenant_id;
  const { userId } = req.params;
  const { commissionPercentage, effectiveFrom } = req.body;
  const row = await commissionService.setRate(tenantId, req.user.id, userId, commissionPercentage, effectiveFrom);
  res.json({ success: true, data: row });
});

const getSettings = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenant_id;
  const rows = await commissionService.getAllRates(tenantId);
  res.json({ success: true, data: rows });
});

const getMine = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenant_id;
  const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const result = await commissionService.getMine(tenantId, req.user.id, {
    offset,
    limit: parseInt(limit, 10),
    status,
    dateFrom,
    dateTo,
  });
  res.json({ success: true, data: result });
});

const getAll = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenant_id;
  const { status, userId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const result = await commissionService.getAll(tenantId, {
    offset,
    limit: parseInt(limit, 10),
    status,
    userId,
    dateFrom,
    dateTo,
  });
  res.json({ success: true, data: result });
});

const pay = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenant_id;
  const { id } = req.params;
  const row = await commissionService.markPaid(tenantId, req.user.id, id);
  res.json({ success: true, data: row });
});

module.exports = { setRate, getSettings, getMine, getAll, pay };
