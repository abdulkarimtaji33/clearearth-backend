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

const registerPushToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token || typeof token !== 'string') {
    return ApiResponse.error(res, 'token is required', 400);
  }
  await notificationService.registerPushToken(req.tenant.id, req.user.id, token, platform);
  return ApiResponse.success(res, { ok: true });
});

const removePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (token) await notificationService.removePushToken(req.user.id, token);
  return ApiResponse.success(res, { ok: true });
});

module.exports = { getMine, markRead, markAllRead, registerPushToken, removePushToken };
