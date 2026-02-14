/**
 * Authentication Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomString,
} = require('../utils/helpers');
const { USER_STATUS, USER_ROLE, RECORD_STATUS } = require('../constants');

/**
 * Register new tenant and admin user
 */
const register = async data => {
  const { tenantName, companyName, email, password, firstName, lastName, phone } = data;

  // Check if email already exists
  const existingTenant = await db.Tenant.findOne({ where: { email } });
  if (existingTenant) {
    throw ApiError.conflict('Email already registered');
  }

  // Start transaction
  const transaction = await db.sequelize.transaction();

  try {
    // Create tenant
    const tenant = await db.Tenant.create(
      {
        name: tenantName,
        company_name: companyName,
        email,
        phone,
        status: RECORD_STATUS.ACTIVE,
        subscription_start_date: new Date(),
      },
      { transaction }
    );

    // Create tenant admin role
    const adminRole = await db.Role.create(
      {
        tenant_id: tenant.id,
        name: USER_ROLE.TENANT_ADMIN,
        display_name: 'Tenant Administrator',
        description: 'Full access to tenant resources',
        is_system_role: true,
        status: RECORD_STATUS.ACTIVE,
      },
      { transaction }
    );

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const user = await db.User.create(
      {
        tenant_id: tenant.id,
        role_id: adminRole.id,
        username: email.split('@')[0],
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
        status: USER_STATUS.ACTIVE,
        email_verified_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: tenant.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: adminRole.name,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        companyName: tenant.company_name,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  // Find user with tenant and role
  const user = await db.User.scope('withPassword').findOne({
    where: { email },
    include: [
      {
        model: db.Tenant,
        as: 'tenant',
      },
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
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check user status
  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Your account is not active');
  }

  // Check tenant status
  if (user.tenant.status !== RECORD_STATUS.ACTIVE) {
    throw ApiError.forbidden('Your organization account is not active');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  await user.update({
    last_login_at: new Date(),
    last_login_ip: null, // Should be set from request IP
  });

  // Generate tokens
  const accessToken = generateToken({
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role.name,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tenantId: user.tenant_id,
  });

  // Get permissions
  const permissions = user.role.permissions.map(p => p.name);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role.name,
      permissions,
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      companyName: user.tenant.company_name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 */
const refreshToken = async token => {
  try {
    const decoded = verifyRefreshToken(token);

    const user = await db.User.findByPk(decoded.userId, {
      include: [
        {
          model: db.Tenant,
          as: 'tenant',
        },
        {
          model: db.Role,
          as: 'role',
        },
      ],
    });

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const accessToken = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role.name,
    });

    return { accessToken };
  } catch (error) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
};

/**
 * Forgot password
 */
const forgotPassword = async email => {
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  // Generate reset token
  const resetToken = generateRandomString(32);
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  await user.update({
    password_reset_token: resetToken,
    password_reset_expires: resetExpires,
  });

  // TODO: Send email with reset link
  // await emailService.sendPasswordResetEmail(user.email, resetToken);

  return;
};

/**
 * Reset password
 */
const resetPassword = async (token, newPassword) => {
  const user = await db.User.scope('withPassword').findOne({
    where: {
      password_reset_token: token,
      password_reset_expires: { [db.Sequelize.Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(newPassword);

  await user.update({
    password: hashedPassword,
    password_reset_token: null,
    password_reset_expires: null,
  });
};

/**
 * Get current user
 */
const getCurrentUser = async userId => {
  const user = await db.User.findByPk(userId, {
    include: [
      {
        model: db.Tenant,
        as: 'tenant',
      },
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
    throw ApiError.notFound('User not found');
  }

  const permissions = user.role.permissions.map(p => p.name);

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    avatar: user.avatar,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.display_name,
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      companyName: user.tenant.company_name,
    },
    permissions,
  };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await db.User.scope('withPassword').findByPk(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  await user.update({ password: hashedPassword });
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword,
};
