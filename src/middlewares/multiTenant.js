/**
 * Multi-Tenant Middleware
 */
const { Sequelize } = require('sequelize');
const ApiError = require('../utils/apiError');
const config = require('../config');
const { asyncHandler } = require('./errorHandler');

/**
 * Tenant Context Middleware
 * Extracts tenant ID from JWT token (already set in auth middleware)
 * or from header for public endpoints
 */
const tenantContext = asyncHandler(async (req, res, next) => {
  // If tenant is already set by auth middleware, continue
  if (req.tenant && req.tenant.id) {
    return next();
  }

  // Try to get tenant from header (for public endpoints)
  const tenantId = req.headers[config.multiTenant.headerName];

  if (tenantId) {
    req.tenant = { id: parseInt(tenantId) };
  }

  next();
});

/**
 * Require Tenant Middleware
 * Ensures tenant context is present
 */
const requireTenant = asyncHandler(async (req, res, next) => {
  if (!req.tenant || !req.tenant.id) {
    throw ApiError.badRequest('Tenant ID is required');
  }

  next();
});

/**
 * Apply tenant scope to Sequelize model queries
 * This is used in the model definition
 */
const applyTenantScope = (model, tenantId) => {
  return model.scope({ method: ['tenant', tenantId] });
};

/**
 * Tenant Isolation Hook
 * Automatically adds tenant_id to all queries
 * This should be added to Sequelize hooks
 */
const addTenantHooks = model => {
  // Before create hook
  model.addHook('beforeCreate', (instance, options) => {
    if (options.tenantId && !instance.tenant_id) {
      instance.tenant_id = options.tenantId;
    }
  });

  // Before find hooks
  model.addHook('beforeFind', options => {
    if (options.tenantId) {
      options.where = options.where || {};
      if (Array.isArray(options.where)) {
        options.where.push({ tenant_id: options.tenantId });
      } else {
        options.where.tenant_id = options.tenantId;
      }
    }
  });

  // Before update hook
  model.addHook('beforeUpdate', (instance, options) => {
    if (options.tenantId) {
      options.where = options.where || {};
      options.where.tenant_id = options.tenantId;
    }
  });

  // Before destroy hook
  model.addHook('beforeDestroy', options => {
    if (options.tenantId) {
      options.where = options.where || {};
      options.where.tenant_id = options.tenantId;
    }
  });

  // Before bulk create hook
  model.addHook('beforeBulkCreate', (instances, options) => {
    if (options.tenantId) {
      instances.forEach(instance => {
        if (!instance.tenant_id) {
          instance.tenant_id = options.tenantId;
        }
      });
    }
  });

  // Before bulk update hook
  model.addHook('beforeBulkUpdate', options => {
    if (options.tenantId) {
      options.where = options.where || {};
      options.where.tenant_id = options.tenantId;
    }
  });

  // Before bulk destroy hook
  model.addHook('beforeBulkDestroy', options => {
    if (options.tenantId) {
      options.where = options.where || {};
      options.where.tenant_id = options.tenantId;
    }
  });
};

/**
 * Get tenant-scoped model
 */
const getTenantModel = (model, tenantId) => {
  if (!tenantId) {
    throw ApiError.badRequest('Tenant ID is required for this operation');
  }

  // Return model with tenant scope applied
  return {
    ...model,
    findAll: options =>
      model.findAll({
        ...options,
        where: {
          ...options?.where,
          tenant_id: tenantId,
        },
        tenantId,
      }),
    findOne: options =>
      model.findOne({
        ...options,
        where: {
          ...options?.where,
          tenant_id: tenantId,
        },
        tenantId,
      }),
    findByPk: (id, options) =>
      model.findOne({
        ...options,
        where: {
          ...options?.where,
          id,
          tenant_id: tenantId,
        },
        tenantId,
      }),
    create: (data, options) =>
      model.create(
        {
          ...data,
          tenant_id: tenantId,
        },
        {
          ...options,
          tenantId,
        }
      ),
    update: (data, options) =>
      model.update(data, {
        ...options,
        where: {
          ...options?.where,
          tenant_id: tenantId,
        },
        tenantId,
      }),
    destroy: options =>
      model.destroy({
        ...options,
        where: {
          ...options?.where,
          tenant_id: tenantId,
        },
        tenantId,
      }),
    count: options =>
      model.count({
        ...options,
        where: {
          ...options?.where,
          tenant_id: tenantId,
        },
        tenantId,
      }),
  };
};

module.exports = {
  tenantContext,
  requireTenant,
  applyTenantScope,
  addTenantHooks,
  getTenantModel,
};
