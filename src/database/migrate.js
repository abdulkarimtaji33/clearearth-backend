/**
 * Database Migration Runner
 */
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: console.log,
  }
);

async function runMigrations() {
  try {
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    console.log('🔄 Running migrations...');
    const migrationsPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    for (const file of files) {
      console.log(`📝 Executing: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
