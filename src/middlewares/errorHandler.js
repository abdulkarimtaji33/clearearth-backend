/**
 * Global Error Handler Middleware
 */
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.tenant?.id,
  });

  // Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.validationError('Validation failed', errors);
  }

  // Handle Sequelize Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    error = ApiError.conflict(`${field} already exists`);
  }

  // Handle Sequelize Foreign Key Constraint Errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = ApiError.badRequest('Invalid reference to related resource');
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  // Handle Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size too large');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = ApiError.badRequest('Too many files');
    } else {
      error = ApiError.badRequest('File upload error');
    }
  }

  // Default to 500 if not an operational error
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      config.app.env === 'production' ? 'Internal server error' : err.message,
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  // Send error response
  return ApiResponse.error(
    res,
    error.message,
    error.statusCode,
    config.app.env === 'development' ? error.errors || err.stack : error.errors
  );
};

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async Error Handler Wrapper
 */
const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
