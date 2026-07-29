/**
 * Persist backend errors to the error_logs table (fire-and-forget).
 */
const logger = require('./logger');

/**
 * @param {object} payload
 * @param {number} [payload.statusCode=500]
 * @param {string} [payload.errorName]
 * @param {string} payload.message
 * @param {string} [payload.stack]
 * @param {string} [payload.method]
 * @param {string} [payload.url]
 * @param {string} [payload.ipAddress]
 * @param {number|null} [payload.tenantId]
 * @param {number|null} [payload.userId]
 */
const persistErrorLog = (payload = {}) => {
  try {
    const db = require('../models');
    if (!db.ErrorLog) return;

    const message = String(payload.message || 'Unknown error').slice(0, 65000);
    if (!message) return;

    db.ErrorLog.create({
      tenant_id: payload.tenantId ?? null,
      user_id: payload.userId ?? null,
      status_code: payload.statusCode || 500,
      error_name: payload.errorName ? String(payload.errorName).slice(0, 100) : null,
      message,
      stack: payload.stack ? String(payload.stack).slice(0, 500000) : null,
      method: payload.method ? String(payload.method).slice(0, 10) : null,
      url: payload.url ? String(payload.url).slice(0, 500) : null,
      ip_address: payload.ipAddress ? String(payload.ipAddress).slice(0, 45) : null,
    }).catch(dbErr => {
      logger.error('Failed to write error_logs row:', { message: dbErr.message, stack: dbErr.stack });
    });
  } catch (err) {
    logger.error('persistErrorLog failed:', { message: err.message, stack: err.stack });
  }
};

module.exports = { persistErrorLog };
