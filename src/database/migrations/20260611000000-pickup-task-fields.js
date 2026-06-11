'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const hasCol = async (table, col) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        { replacements: [table, col] }
      );
      return rows.length > 0;
    };

    const hasTable = async (table) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        { replacements: [table] }
      );
      return rows.length > 0;
    };

    if (!(await hasCol('work_order_tasks', 'pickup_quantity'))) {
      await queryInterface.addColumn('work_order_tasks', 'pickup_quantity', {
        type: DataTypes.STRING(100),
        allowNull: true,
        after: 'notes',
      });
    }

    if (!(await hasCol('work_order_tasks', 'pickup_condition'))) {
      await queryInterface.addColumn('work_order_tasks', 'pickup_condition', {
        type: DataTypes.STRING(100),
        allowNull: true,
        after: 'pickup_quantity',
      });
    }

    if (!(await hasTable('work_order_task_files'))) {
      await queryInterface.createTable('work_order_task_files', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        task_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'work_order_tasks', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        image_url: { type: DataTypes.STRING(500), allowNull: false },
        original_name: { type: DataTypes.STRING(255), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      await queryInterface.addIndex('work_order_task_files', ['task_id'], {
        name: 'idx_wot_files_task',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('work_order_task_files');
    await queryInterface.removeColumn('work_order_tasks', 'pickup_condition');
    await queryInterface.removeColumn('work_order_tasks', 'pickup_quantity');
  },
};
