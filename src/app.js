/**
 * Express Application Configuration
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('express-async-errors');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parsers - scoped to /api only; the AdminJS panel mounted below
// (finalizeApp) parses its own request bodies via express-formidable and
// is incompatible with these running in front of it.
app.use(`/api/${config.app.version}`, express.json({ limit: '25mb' }));
app.use(`/api/${config.app.version}`, express.urlencoded({ extended: true, limit: '25mb' }));

// Compression - skip PDF and other binary to prevent corruption
app.use(
  compression({
    filter: (req, res) => {
      if (req.path?.includes('/pdf')) return false;
      const type = res.getHeader('Content-Type') || '';
      if (type.includes('application/pdf')) return false;
      return compression.filter(req, res);
    },
  })
);

// Request logging
if (config.app.env !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Static files
app.use('/uploads', express.static(config.upload.path));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: config.app.env,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use(`/api/${config.app.version}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    environment: config.app.env,
    message: 'ClearEarth ERP API is running',
    documentation: `/api/${config.app.version}/docs`,
  });
});

/**
 * Finish wiring the app: mount the super-admin DB panel (AdminJS is ESM-only,
 * so it must be dynamically imported) and attach the catch-all/error handlers
 * last, since Express matches middleware in registration order.
 */
const finalizeApp = async () => {
  const { mountAdminPanel } = require('./admin/setup');
  await mountAdminPanel(app);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};

module.exports = finalizeApp;
