'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'receivable | payable | expense',
      },
      source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'tax_invoice.id | purchase_order.id | expense.id',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      payment_account_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'chart_of_accounts', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      reference_no: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      paid_to: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      received_from: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paid_at: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('payment_transactions', ['tenant_id']);
    await queryInterface.addIndex('payment_transactions', ['source_type', 'source_id']);
    await queryInterface.addIndex('payment_transactions', ['paid_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_transactions');
  },
};
