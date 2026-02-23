const { Sequelize } = require('sequelize');
const config = require('../config/database');

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
    logging: false,
  }
);

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('📊 Existing tables:');
    tables.forEach((row, index) => {
      console.log(`${index + 1}. ${Object.values(row)[0]}`);
    });
    console.log(`\nTotal: ${tables.length} tables\n`);

    if (tables.length > 0) {
      const tableName = Object.values(tables[0])[0];
      const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
      console.log(`\n📑 Sample indexes from ${tableName}:`);
      console.log(indexes.slice(0, 5));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
