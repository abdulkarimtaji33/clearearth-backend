/**
 * Database Connection and Sequelize Instance
 */
const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config.database[env];

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging ? msg => logger.debug(msg) : false,
  pool: dbConfig.pool,
  define: dbConfig.define,
  timezone: dbConfig.timezone,
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Sync database (only for development)
const syncDatabase = async (options = {}) => {
  try {
    if (env === 'development') {
      await sequelize.sync(options);
      logger.info('✅ Database synchronized successfully');
    } else {
      logger.warn('⚠️ Database sync skipped in production. Use migrations instead.');
    }
  } catch (error) {
    logger.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// Close connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
