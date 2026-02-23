/**
 * Smart Migration Runner - Applies only pending migrations
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

    // Create migrations tracking table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already applied migrations
    const [appliedMigrations] = await sequelize.query(
      'SELECT migration_name FROM migration_history ORDER BY migration_name'
    );
    const appliedNames = appliedMigrations.map(m => m.migration_name);
    console.log('📝 Already applied migrations:', appliedNames.length);
    appliedNames.forEach(name => console.log(`   ✓ ${name}`));
    console.log('');

    // Get all migration files
    const migrationsPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.js'))
      .sort();

    // Filter pending migrations
    const pendingMigrations = files.filter(file => !appliedNames.includes(file));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations. Database is up to date!');
      process.exit(0);
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migrations:\n`);
    pendingMigrations.forEach(name => console.log(`   • ${name}`));
    console.log('');

    // Run pending migrations
    for (const file of pendingMigrations) {
      console.log(`📝 Executing: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      
      try {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        
        // Record successful migration
        await sequelize.query(
          'INSERT INTO migration_history (migration_name) VALUES (?)',
          { replacements: [file] }
        );
        
        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Failed on: ${file}`);
        console.error(`   Error: ${error.message}`);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
