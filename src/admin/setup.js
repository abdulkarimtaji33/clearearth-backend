/**
 * Super Admin DB Panel (AdminJS)
 *
 * Exposes every Sequelize model as a full CRUD screen behind a login gate
 * that only lets in users whose role is 'super_admin'. AdminJS is ESM-only,
 * so it's loaded via dynamic import() from this CommonJS module.
 */
const bcrypt = require('bcryptjs');
const db = require('../models');
const logger = require('../utils/logger');

const ADMIN_ROOT_PATH = process.env.ADMIN_PANEL_PATH || '/system-console';

// Columns that must never render in list/show/filter views, even though
// they stay editable so a super admin can still overwrite them.
const SENSITIVE_FIELDS = {
  User: ['password', 'password_reset_token', 'two_factor_secret'],
};

function buildResourceOptions(modelName) {
  const hidden = SENSITIVE_FIELDS[modelName];
  if (!hidden) return {};

  const properties = {};
  hidden.forEach(field => {
    properties[field] = {
      isVisible: { list: false, filter: false, show: false, edit: true },
    };
  });

  return { properties };
}

async function mountAdminPanel(app) {
  const [{ default: AdminJS }, { Database, Resource }, AdminJSExpress, { default: session }] =
    await Promise.all([
      import('adminjs'),
      import('@adminjs/sequelize'),
      import('@adminjs/express'),
      import('express-session'),
    ]);

  AdminJS.registerAdapter({ Database, Resource });

  // employee_id carries raw FK metadata pointing at an 'employees' table that
  // has no corresponding Sequelize model/resource loaded here, which makes
  // AdminJS's reference resolver 500 on every list/show. Strip it so the
  // column renders as a plain number instead of a broken reference.
  if (db.User.rawAttributes.employee_id) {
    delete db.User.rawAttributes.employee_id.references;
  }

  const excluded = new Set(['sequelize', 'Sequelize']);
  const resources = Object.keys(db)
    .filter(name => !excluded.has(name))
    .map(name => ({
      resource: db[name],
      options: buildResourceOptions(name),
    }));

  const adminJs = new AdminJS({
    resources,
    rootPath: ADMIN_ROOT_PATH,
    loginPath: `${ADMIN_ROOT_PATH}/login`,
    logoutPath: `${ADMIN_ROOT_PATH}/logout`,
    branding: {
      companyName: 'ClearEarth Super Admin',
      softwareBrothers: false,
    },
  });

  // Keep password hashes valid if a super admin edits a User's password field.
  const userResource = adminJs.options.resources.find(r => r.resource === db.User);
  if (userResource) {
    ['new', 'edit'].forEach(actionName => {
      const action = userResource.options.actions?.[actionName] || {};
      userResource.options.actions = {
        ...userResource.options.actions,
        [actionName]: {
          ...action,
          before: async request => {
            if (request.payload?.password) {
              request.payload.password = await bcrypt.hash(request.payload.password, 10);
            }
            return request;
          },
        },
      };
    });
  }

  const authenticate = async (email, password) => {
    const user = await db.User.unscoped().findOne({
      where: { email },
      include: [{ model: db.Role, as: 'role' }],
    });

    if (!user || user.role?.name !== 'super_admin') return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    return { email: user.email, id: user.id, title: `${user.first_name} ${user.last_name}` };
  };

  const router = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate,
      cookiePassword: process.env.ADMIN_COOKIE_SECRET || process.env.JWT_SECRET,
    },
    null,
    {
      secret: process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'clearearth-admin.sid',
      // Production is served over plain HTTP behind Nginx (no TLS) per DEPLOYMENT.md,
      // so the cookie can't be marked secure or logins would silently fail.
      cookie: { httpOnly: true, secure: process.env.ADMIN_COOKIE_SECURE === 'true' },
    }
  );

  app.use(adminJs.options.rootPath, router);
  logger.info(`🔐 Super admin panel mounted at ${adminJs.options.rootPath}`);
}

module.exports = { mountAdminPanel, ADMIN_ROOT_PATH };
