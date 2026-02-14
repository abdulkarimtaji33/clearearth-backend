/**
 * Custom API Error Class
 */
const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = null) {
    return new ApiError(message, StatusCodes.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, StatusCodes.FORBIDDEN);
  }

  static notFound(message = 'Not Found') {
    return new ApiError(message, StatusCodes.NOT_FOUND);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(message, StatusCodes.CONFLICT);
  }

  static validationError(message = 'Validation Error', errors = null) {
    return new ApiError(message, StatusCodes.UNPROCESSABLE_ENTITY, errors);
  }

  static internalError(message = 'Internal Server Error') {
    return new ApiError(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

module.exports = ApiError;
