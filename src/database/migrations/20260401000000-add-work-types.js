module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface;
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uk_work_types_tenant_name (tenant_id, name),
        INDEX idx_work_types_tenant (tenant_id),
        CONSTRAINT fk_work_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    try {
      await sequelize.query('ALTER TABLE work_order_tasks ADD COLUMN work_type_id INT NULL');
    } catch (e) {
      if (!String(e.message || '').includes('Duplicate')) throw e;
    }
    try {
      await sequelize.query('ALTER TABLE work_order_tasks ADD INDEX idx_work_order_tasks_work_type (work_type_id)');
    } catch (e) {
      if (!String(e.message || '').includes('Duplicate')) throw e;
    }
    try {
      await sequelize.query(`
        ALTER TABLE work_order_tasks
        ADD CONSTRAINT fk_work_order_tasks_work_type FOREIGN KEY (work_type_id) REFERENCES work_types(id)
      `);
    } catch (e) {
      if (!String(e.message || '').includes('Duplicate') && !String(e.message || '').includes('already exists')) throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface;
    try {
      await sequelize.query(`
        ALTER TABLE work_order_tasks
        DROP FOREIGN KEY fk_work_order_tasks_work_type,
        DROP INDEX idx_work_order_tasks_work_type,
        DROP COLUMN work_type_id
      `);
    } catch (e) {
      /* ignore */
    }
    await sequelize.query('DROP TABLE IF EXISTS work_types');
  },
};
