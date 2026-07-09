'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payment_transactions', 'receipt_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Customer-facing receipt number, assigned for receivable-side payments',
    });
    await queryInterface.addIndex('payment_transactions', ['tenant_id', 'receipt_number'], {
      name: 'idx_payment_transactions_receipt_number',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('payment_transactions', 'idx_payment_transactions_receipt_number');
    await queryInterface.removeColumn('payment_transactions', 'receipt_number');
  },
};
