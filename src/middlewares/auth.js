/**
 * Authentication Middleware
 */
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/helpers');
const { asyncHandler } = require('./errorHandler');
const db = require('../models');
const accessService = require('../services/access.service');

/**
 * Verify JWT Token and Authenticate User
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  const decoded = verifyToken(token);

  // Get user from database
  const user = await db.User.findByPk(decoded.userId, {
    include: [
      {
        model: db.Role,
        as: 'role',
        include: [
          {
            model: db.Permission,
            as: 'permissions',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('User account is not active');
  }

  // Effective access = role permissions ± per-user overrides, plus data scopes and field rules
  const access = await accessService.getAccess(user);
  user.access = access;

  // Attach user and tenant to request
  req.user = user;
  req.access = access;
  req.tenant = { id: decoded.tenantId };

  next();
});

/**
 * Check if user has specific permission (any one of the listed permissions).
 * Based on effective access: role permissions plus per-user grants minus per-user revokes.
 */
const authorize = (...permissions) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const access = req.access || req.user.access;
    if (!access || !access.hasAny(...permissions)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  });
};

/**
 * Check if user has specific role
 */
const authorizeRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role.name)) {
      throw ApiError.forbidden('Access denied for your role');
    }

    next();
  });
};

/**
 * Optional authentication (doesn't throw error if no token)
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const user = await db.User.findByPk(decoded.userId, {
        include: [
          {
            model: db.Role,
            as: 'role',
          },
        ],
      });

      if (user && user.status === 'active') {
        req.user = user;
        req.tenant = { id: decoded.tenantId };
      }
    } catch (error) {
      // Silently ignore token errors for optional auth
    }
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  authorizeRole,
  optionalAuth,
};
