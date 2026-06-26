const db = require('../src/models');

(async () => {
  await db.sequelize.authenticate();
  const [[users]] = await db.sequelize.query('SELECT COUNT(*) AS c FROM users');
  const [[deals]] = await db.sequelize.query('SELECT COUNT(*) AS c FROM deals');
  const [[tenants]] = await db.sequelize.query('SELECT COUNT(*) AS c FROM tenants');
  console.log(`DB OK tenants=${tenants.c} users=${users.c} deals=${deals.c}`);
  process.exit(0);
})().catch((e) => {
  console.error('DB FAIL:', e.message);
  process.exit(1);
});
