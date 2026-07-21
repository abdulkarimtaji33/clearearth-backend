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

// @adminjs/sequelize's Property.isEditable() returns false for
// autoIncrement/primary-key/auto-generated (timestamp) columns, so AdminJS
// omits id/created_at/updated_at/deleted_at from create/edit forms by
// default. This is a full-control DB tool, not a scoped app CRUD screen -
// every column on every table should be directly editable. isVisible is a
// public ResourceOptions field (unlike the adapter's internal Property
// class) and takes priority over isEditable() when set, so force it here
// for every attribute instead of monkey-patching an unexported internal.
function buildResourceOptions(modelName, model) {
  const hiddenFields = new Set(SENSITIVE_FIELDS[modelName] || []);
  const properties = {};

  Object.keys(model.rawAttributes).forEach(field => {
    properties[field] = {
      isVisible: {
        list: !hiddenFields.has(field),
        filter: !hiddenFields.has(field),
        show: !hiddenFields.has(field),
        edit: true,
      },
    };
  });

  return { properties };
}

// @adminjs/sequelize's Resource.find/findMany/findById/count/update call the
// model's findAll/findByPk/count/update directly with no `paranoid` override,
// so paranoid models (soft-delete via deleted_at) silently hide deleted rows
// in reads (filtering a soft-deleted row returns "No records" with no
// indication why) AND silently no-op on writes: Model.update() auto-scopes
// its WHERE to `deleted_at IS NULL`, so editing an already soft-deleted row
// matches zero rows - AdminJS still reports "Successfully updated" because
// it re-fetches by ID afterward (which works) rather than checking the
// affected-row count. A super admin panel should see and be able to edit
// every row that physically exists, so force paranoid: false throughout.
function withoutParanoid(model) {
  return new Proxy(model, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'findAll' || prop === 'count') {
        return (options = {}) => value.call(target, { ...options, paranoid: false });
      }
      if (prop === 'findByPk') {
        return (id, options = {}) => value.call(target, id, { ...options, paranoid: false });
      }
      if (prop === 'update') {
        // silent: true stops Sequelize from auto-overwriting updated_at with
        // the current time on every save, so a manually-typed value in the
        // form (including deleted_at/created_at/updated_at themselves,
        // which are otherwise plain editable columns) actually persists.
        return (values, options = {}) =>
          value.call(target, values, { ...options, paranoid: false, silent: true });
      }
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
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

  // Resource.delete() always calls instance.destroy() with no options, which
  // on a paranoid model just re-stamps deleted_at - a silent no-op on a row
  // that's already soft-deleted, since Sequelize's paranoid destroy doesn't
  // check whether it was already deleted. Combined with the read fix above
  // (soft-deleted rows now stay visible), every delete click looked like it
  // did nothing. Make it a two-step delete: first click soft-deletes (as the
  // app itself would, reversible, stays visible with Deleted At set); a
  // second click on an already-deleted row permanently purges it.
  Resource.prototype.delete = async function delete_(id) {
    const model = await this.SequelizeModel.findByPk(id);
    await model.destroy({ force: !!model.deleted_at });
  };

  // employee_id carries raw FK metadata pointing at an 'employees' table that
  // has no corresponding Sequelize model/resource loaded here, which makes
  // AdminJS's reference resolver 500 on every list/show. Strip it so the
  // column renders as a plain number instead of a broken reference.
  if (db.User.rawAttributes.employee_id) {
    delete db.User.rawAttributes.employee_id.references;
  }

  const excluded = new Set(['sequelize', 'Sequelize']);
  const modelNames = Object.keys(db).filter(name => !excluded.has(name));
  const proxiedModels = {};
  const resources = modelNames.map(name => {
    const resource = withoutParanoid(db[name]);
    proxiedModels[name] = resource;
    return { resource, options: buildResourceOptions(name, db[name]) };
  });

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
  const userResource = adminJs.options.resources.find(r => r.resource === proxiedModels.User);
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
