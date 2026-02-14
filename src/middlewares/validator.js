/**
 * Validation Middleware using express-validator
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    throw ApiError.validationError('Validation failed', formattedErrors);
  }

  next();
};

module.exports = {
  validate,
};
