/**
 * Server Entry Point
 */
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { testConnection, syncDatabase } = require('./database');

const PORT = config.app.port;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database (only in development)
    if (config.app.env === 'development') {
      await syncDatabase({ alter: true });
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server started successfully`);
      logger.info(`📍 Environment: ${config.app.env}`);
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/${config.app.version}`);
      logger.info(`📚 Documentation: http://localhost:${PORT}/api/${config.app.version}/docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = signal => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        const { closeConnection } = require('./database');
        await closeConnection();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
