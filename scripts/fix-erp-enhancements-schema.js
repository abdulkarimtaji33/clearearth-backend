/**
 * One-off / idempotent: columns from 20260525000000-erp-enhancements migration.
 * Also wired into run-migration.js for future deploys.
 */
const db = require('../src/models');

function isDup(e) {
  const m = e?.message || '';
  return /Duplicate|already exists/i.test(m);
}

async function main() {
  const alters = [
    "ALTER TABLE deal_inspection_requests ADD COLUMN priority ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium'",
    "ALTER TABLE deal_inspection_requests ADD COLUMN response_status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending'",
    'ALTER TABLE deal_inspection_requests ADD COLUMN rejection_reason TEXT NULL',
    'ALTER TABLE deal_inspection_requests ADD COLUMN responded_by INT NULL',
    'ALTER TABLE deal_inspection_requests ADD COLUMN responded_at DATETIME NULL',
    'ALTER TABLE work_order_task_expenses ADD COLUMN evidence_path VARCHAR(500) NULL',
    'ALTER TABLE work_order_task_expenses ADD COLUMN evidence_file_name VARCHAR(255) NULL',
    'ALTER TABLE work_order_task_expenses ADD COLUMN rejection_reason TEXT NULL',
  ];

  for (const q of alters) {
    try {
      await db.sequelize.query(q);
      console.log('OK:', q.slice(0, 70));
    } catch (e) {
      if (isDup(e)) console.log('skip (exists):', q.slice(0, 50));
      else throw e;
    }
  }

  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      entity_type VARCHAR(50) NULL,
      entity_id INT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_notif_tenant_user_read (tenant_id, user_id, is_read),
      KEY idx_notif_tenant_user_created (tenant_id, user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('notifications table OK');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
