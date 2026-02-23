const db = require('./src/models');

async function dropAllTables() {
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const [tables] = await db.sequelize.query("SHOW TABLES");
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`Dropping table: ${tableName}`);
      await db.sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('All tables dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropAllTables();
