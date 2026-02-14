/**
 * Application Configuration
 */
require('dotenv').config();

module.exports = {
  // Application
  app: {
    name: 'ClearEarth ERP',
    version: process.env.API_VERSION || 'v1',
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Database
  database: require('./database'),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // File Upload
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@clearearth.com',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Multi-Tenancy
  multiTenant: {
    headerName: process.env.TENANT_HEADER || 'x-tenant-id',
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  },

  // Locale & Currency
  locale: {
    currency: process.env.DEFAULT_CURRENCY || 'AED',
    locale: process.env.DEFAULT_LOCALE || 'en_AE',
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Dubai',
  },

  // VAT Configuration
  vat: {
    rate: parseFloat(process.env.VAT_RATE) || 0.05,
    registrationNumber: process.env.VAT_REGISTRATION_NUMBER || '',
  },

  // FTA Configuration
  fta: {
    auditFileFormat: process.env.FTA_AUDIT_FILE_FORMAT || 'CSV',
    companyTrn: process.env.FTA_COMPANY_TRN || '',
  },
};
