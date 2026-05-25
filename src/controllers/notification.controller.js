const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

const getMine = asyncHandler(async (req, res) => {
  const { limit, unreadOnly } = req.query;
  const result = await notificationService.getForUser(req.tenant.id, req.user.id, {
    limit: limit ? parseInt(limit, 10) : 20,
    unreadOnly: unreadOnly === 'true',
  });
  return ApiResponse.success(res, result);
});

const markRead = asyncHandler(async (req, res) => {
  const row = await notificationService.markRead(req.tenant.id, req.user.id, req.params.id);
  return ApiResponse.success(res, row);
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.tenant.id, req.user.id);
  return ApiResponse.success(res, { ok: true });
});

module.exports = { getMine, markRead, markAllRead };
