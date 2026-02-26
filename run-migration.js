const db = require('./src/models');

async function runMigration() {
  try {
    
    
    console.log('Adding contact_type to contacts...');
    await db.sequelize.query(`
      ALTER TABLE contacts ADD COLUMN contact_type ENUM('clients', 'vendors') NULL AFTER status
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
