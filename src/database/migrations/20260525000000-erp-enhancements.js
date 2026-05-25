'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('deal_inspection_requests', 'priority', {
      type: Sequelize.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    });

    await queryInterface.addColumn('deal_inspection_requests', 'response_status', {
      type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('deal_inspection_requests', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('deal_inspection_requests', 'responded_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    });

    await queryInterface.addColumn('deal_inspection_requests', 'responded_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('work_order_task_expenses', 'evidence_path', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('work_order_task_expenses', 'evidence_file_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('work_order_task_expenses', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('notifications', ['tenant_id', 'user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['tenant_id', 'user_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.removeColumn('work_order_task_expenses', 'rejection_reason');
    await queryInterface.removeColumn('work_order_task_expenses', 'evidence_file_name');
    await queryInterface.removeColumn('work_order_task_expenses', 'evidence_path');
    await queryInterface.removeColumn('deal_inspection_requests', 'responded_at');
    await queryInterface.removeColumn('deal_inspection_requests', 'responded_by');
    await queryInterface.removeColumn('deal_inspection_requests', 'rejection_reason');
    await queryInterface.removeColumn('deal_inspection_requests', 'response_status');
    await queryInterface.removeColumn('deal_inspection_requests', 'priority');
  },
};
