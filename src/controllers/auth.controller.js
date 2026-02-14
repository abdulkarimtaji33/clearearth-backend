/**
 * Authentication Controller
 */
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Register new tenant and admin user
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, result, 'Registration successful');
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Login successful');
});

/**
 * Refresh access token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  // Can implement token blacklisting here if needed
  return ApiResponse.success(res, null, 'Logout successful');
});

/**
 * Forgot password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, null, 'Password reset email sent');
});

/**
 * Reset password
 */
const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return ApiResponse.success(res, null, 'Password reset successful');
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return ApiResponse.success(res, user, 'User retrieved successfully');
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  return ApiResponse.success(res, null, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword,
};
