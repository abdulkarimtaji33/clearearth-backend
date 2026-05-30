'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('journal_entries', 'paid_to', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Payee / vendor for outbound payments',
    });
    await queryInterface.addColumn('journal_entries', 'received_from', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Payer / client for inbound receipts',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('journal_entries', 'received_from');
    await queryInterface.removeColumn('journal_entries', 'paid_to');
  },
};
