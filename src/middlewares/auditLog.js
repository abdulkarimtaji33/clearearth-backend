/**
 * Audit Log Middleware
 */
const { asyncHandler } = require('./errorHandler');
const db = require('../models');
const logger = require('../utils/logger');

/**
 * Create audit log entry
 */
const createAuditLog = async (req, action, module, recordId, oldData = null, newData = null) => {
  try {
    if (!db.AuditLog) {
      logger.warn('AuditLog model not initialized yet');
      return;
    }

    await db.AuditLog.create({
      tenant_id: req.tenant?.id,
      user_id: req.user?.id,
      module,
      action,
      record_id: recordId,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      request_method: req.method,
      request_url: req.originalUrl,
    });
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
};

/**
 * Audit Log Middleware for Create operations
 */
const auditCreate = module => {
  return asyncHandler(async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = data => {
      if (data.success && data.data) {
        createAuditLog(req, 'CREATE', module, data.data.id, null, data.data);
      }
      return originalJson(data);
    };

    next();
  });
};

/**
 * Audit Log Middleware for Update operations
 */
const auditUpdate = module => {
  return asyncHandler(async (req, res, next) => {
    // Store old data before update
    req.oldData = { ...req.record };

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = data => {
      if (data.success && data.data) {
        createAuditLog(req, 'UPDATE', module, data.data.id, req.oldData, data.data);
      }
      return originalJson(data);
    };

    next();
  });
};

/**
 * Audit Log Middleware for Delete operations
 */
const auditDelete = module => {
  return asyncHandler(async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = data => {
      if (data.success) {
        const recordId = req.params.id;
        createAuditLog(req, 'DELETE', module, recordId, req.record, null);
      }
      return originalJson(data);
    };

    next();
  });
};

/**
 * Audit Log Middleware for View operations
 */
const auditView = module => {
  return asyncHandler(async (req, res, next) => {
    if (req.params.id) {
      await createAuditLog(req, 'VIEW', module, req.params.id, null, null);
    }
    next();
  });
};

/**
 * Audit Log Middleware for Export operations
 */
const auditExport = module => {
  return asyncHandler(async (req, res, next) => {
    await createAuditLog(req, 'EXPORT', module, null, null, req.query);
    next();
  });
};

module.exports = {
  createAuditLog,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditView,
  auditExport,
};
