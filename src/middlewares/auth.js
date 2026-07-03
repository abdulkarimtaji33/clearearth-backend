/**
 * Authentication Middleware
 */
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/helpers');
const { asyncHandler } = require('./errorHandler');
const db = require('../models');

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

  // Attach user and tenant to request
  req.user = user;
  req.tenant = { id: decoded.tenantId };
  req.user.hasPermission = (permission) => hasPermissionForUser(req.user, permission);

  next();
});

/**
 * True if the user's role holds the given permission name, or the user is super_admin.
 */
const hasPermissionForUser = (user, permission) => {
  if (!user?.role) return false;
  if (user.role.name === 'super_admin') return true;
  const userPermissions = (user.role.permissions || []).map(p => p.name);
  return userPermissions.includes(permission);
};

/**
 * Check if user has specific permission
 */
const authorize = (...permissions) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Super admin has all permissions
    if (req.user.role.name === 'super_admin') {
      return next();
    }

    // Check if user has required permission (any one of the listed permissions)
    const hasPermission = permissions.some((permission) => hasPermissionForUser(req.user, permission));

    if (!hasPermission) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  });
};

/**
 * Check own-vs-all record scope for a module/action pair (e.g. 'leads', 'read').
 * Grants access if the role holds either `${module}.${action}.all` or `.own`;
 * `.all` takes precedence. Attaches req.scope = { scopeUserId } on `.own`,
 * or req.scope = {} on `.all` / super_admin, for controllers to apply as a filter.
 */
const authorizeScoped = (module, action) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.role.name === 'super_admin') {
      req.scope = {};
      return next();
    }

    const allPermission = `${module}.${action}.all`;
    const ownPermission = `${module}.${action}.own`;

    if (hasPermissionForUser(req.user, allPermission)) {
      req.scope = {};
      return next();
    }

    if (hasPermissionForUser(req.user, ownPermission)) {
      req.scope = { scopeUserId: req.user.id };
      return next();
    }

    throw ApiError.forbidden('Insufficient permissions');
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
  authorizeScoped,
  authorizeRole,
  optionalAuth,
  hasPermissionForUser,
};
