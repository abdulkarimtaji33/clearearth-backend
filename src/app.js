/**
 * Express Application Configuration
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

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

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
