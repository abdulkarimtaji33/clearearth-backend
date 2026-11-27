const QRCode = require('qrcode');
const service = require('../services/warehouse.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

const MANAGER_ROLES = ['super_admin', 'admin', 'tenant_admin', 'operations_manager'];
const isManager = (req) => MANAGER_ROLES.includes(req.user?.role?.name);

const meta = asyncHandler(async (req, res) => ApiResponse.success(res, {
  statuses: service.STATUSES,
  categories: Object.fromEntries(Object.entries(service.CATEGORIES).map(([k, v]) => [k, v.label])),
  actions: Object.fromEntries(Object.entries(service.ACTIONS).map(([k, v]) => [k, v.label])),
  tagGroups: service.TAG_GROUPS,
}));

const summary = asyncHandler(async (req, res) => ApiResponse.success(res, await service.summary(req.tenant.id)));

const tags = asyncHandler(async (req, res) => ApiResponse.success(res, await service.listTags(req.tenant.id)));
const createTag = asyncHandler(async (req, res) => ApiResponse.created(res, await service.createTag(req.tenant.id, req.body), 'Tag created'));

const list = asyncHandler(async (req, res) => {
  const pagination = getPaginationParams(req.query.page, req.query.pageSize);
  const result = await service.list(req.tenant.id, { ...req.query, ...pagination });
  return ApiResponse.paginated(res, result.batches, { page: pagination.page, pageSize: pagination.pageSize, totalItems: result.total });
});

const getById = asyncHandler(async (req, res) => ApiResponse.success(res, await service.getById(req.tenant.id, req.params.id)));
const scan = asyncHandler(async (req, res) => ApiResponse.success(res, await service.scan(req.tenant.id, req.query.code)));
const addTag = asyncHandler(async (req, res) => ApiResponse.success(res, await service.addTag(req.tenant.id, req.params.id, req.body.tagId, req.user), 'Tag added'));
const removeTag = asyncHandler(async (req, res) => ApiResponse.success(res, await service.removeTag(req.tenant.id, req.params.id, req.params.tagId, req.user, isManager(req)), 'Tag removed'));
const action = asyncHandler(async (req, res) => ApiResponse.success(res, await service.performAction(req.tenant.id, req.params.id, req.user, req.body, isManager(req)), 'Recorded'));
const split = asyncHandler(async (req, res) => ApiResponse.success(res, await service.split(req.tenant.id, req.params.id, req.user, req.body.groups), 'Batch split'));

/** QR code image for the label; it encodes the batch code, which the scan screen understands. */
const qr = asyncHandler(async (req, res) => {
  const batch = await service.getById(req.tenant.id, req.params.id);
  const png = await QRCode.toBuffer(batch.batch_code, { width: 320, margin: 1 });
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'private, max-age=3600');
  return res.send(png);
});

module.exports = { meta, summary, tags, createTag, list, getById, scan, addTag, removeTag, action, split, qr };
