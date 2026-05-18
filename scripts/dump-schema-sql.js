/**
 * Dump schema only to ../schema.sql (uses .env DB settings).
 * Run: node scripts/dump-schema-sql.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/database');

const outPath = path.join(__dirname, '..', 'schema.sql');

const header = (dbName, version) => `-- MariaDB/MySQL dump (schema only)
--
-- Host: (from .env)    Database: ${dbName}
-- ------------------------------------------------------
-- Server version\t${version}

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

`;

const footer = `
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
`;

async function main() {
  const [verRows] = await sequelize.query('SELECT DATABASE() AS db, VERSION() AS ver');
  const { db: dbName, ver: version } = verRows[0];
  if (!dbName) {
    throw new Error('No database selected; set DB_NAME in .env');
  }

  const [tables] = await sequelize.query(
    `SELECT TABLE_NAME AS name
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = :db AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    { replacements: { db: dbName } }
  );

  const parts = [header(dbName, version)];

  for (const { name } of tables) {
    const [rows] = await sequelize.query(`SHOW CREATE TABLE \`${name}\``);
    const row = rows[0];
    const createSql = row['Create Table'] || row.CREATE_TABLE || Object.values(row)[1];
    parts.push(`
--
-- Table structure for table \`${name}\`
--

DROP TABLE IF EXISTS \`${name}\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
${createSql};
/*!40101 SET character_set_client = @saved_cs_client */;

`);
  }

  parts.push(footer);
  fs.writeFileSync(outPath, parts.join(''), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (${tables.length} tables)`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => sequelize.close());
