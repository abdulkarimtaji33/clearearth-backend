/**
 * API Response Utility
 */
const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  /**
   * Success Response
   */
  static success(res, data = null, message = 'Success', statusCode = StatusCodes.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Created Response
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  /**
   * No Content Response
   */
  static noContent(res) {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  /**
   * Paginated Response
   */
  static paginated(
    res,
    data,
    pagination,
    message = 'Data retrieved successfully',
    statusCode = StatusCodes.OK
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages: Math.ceil(pagination.totalItems / pagination.pageSize),
        hasNext: pagination.page < Math.ceil(pagination.totalItems / pagination.pageSize),
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Error Response
   */
  static error(
    res,
    message = 'An error occurred',
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    errors = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Bad Request Response
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, StatusCodes.BAD_REQUEST, errors);
  }

  /**
   * Unauthorized Response
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, StatusCodes.UNAUTHORIZED);
  }

  /**
   * Forbidden Response
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, StatusCodes.FORBIDDEN);
  }

  /**
   * Not Found Response
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, StatusCodes.NOT_FOUND);
  }

  /**
   * Conflict Response
   */
  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, StatusCodes.CONFLICT);
  }

  /**
   * Validation Error Response
   */
  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, StatusCodes.UNPROCESSABLE_ENTITY, errors);
  }

  /**
   * Internal Server Error Response
   */
  static serverError(res, message = 'Internal server error', error = null) {
    return this.error(res, message, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
}

module.exports = ApiResponse;
