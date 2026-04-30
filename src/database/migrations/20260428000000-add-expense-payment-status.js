module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface;
    const alters = [
      `ALTER TABLE expenses ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' COMMENT 'unpaid | partial | paid'`,
      `ALTER TABLE expenses ADD COLUMN paid_amount DECIMAL(15,2) NULL`,
      `ALTER TABLE expenses ADD COLUMN paid_at DATE NULL`,
      `ALTER TABLE expenses ADD COLUMN supplier_id INT NULL`,
      `ALTER TABLE expenses ADD INDEX idx_expenses_payment_status (payment_status)`,
      `ALTER TABLE expenses ADD INDEX idx_expenses_supplier_id (supplier_id)`,
      `ALTER TABLE expenses ADD CONSTRAINT fk_expenses_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL ON UPDATE CASCADE`,
    ];
    for (const sql of alters) {
      try {
        await sequelize.query(sql);
      } catch (e) {
        if (!String(e.message || '').includes('Duplicate') && !String(e.message || '').includes('already exists')) {
          throw e;
        }
      }
    }
    try {
      await sequelize.query(`
        UPDATE expenses SET paid_amount = amount, payment_status = 'paid'
        WHERE payment_status = 'unpaid' AND paid_amount IS NULL
      `);
    } catch {
      /* ignore */
    }
  },

  down: async (queryInterface) => {
    const { sequelize } = queryInterface;
    try {
      await sequelize.query('ALTER TABLE expenses DROP FOREIGN KEY fk_expenses_supplier');
    } catch {
      /* ignore */
    }
    const drops = [
      'ALTER TABLE expenses DROP INDEX idx_expenses_supplier_id',
      'ALTER TABLE expenses DROP INDEX idx_expenses_payment_status',
      'ALTER TABLE expenses DROP COLUMN supplier_id',
      'ALTER TABLE expenses DROP COLUMN paid_at',
      'ALTER TABLE expenses DROP COLUMN paid_amount',
      'ALTER TABLE expenses DROP COLUMN payment_status',
    ];
    for (const sql of drops) {
      try {
        await sequelize.query(sql);
      } catch {
        /* ignore */
      }
    }
  },
};
