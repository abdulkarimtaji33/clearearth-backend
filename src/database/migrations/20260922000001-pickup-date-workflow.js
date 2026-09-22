'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const tableName of ['quotations', 'purchase_orders']) {
      const table = await queryInterface.describeTable(tableName);
      if (!table.pickup_date_status) {
        await queryInterface.addColumn(tableName, 'pickup_date_status', {
          type: Sequelize.STRING(30),
          allowNull: true,
          defaultValue: null,
          comment: 'none | pending | confirmed | reschedule_requested',
        });
      }
      if (!table.confirmed_pickup_date) {
        await queryInterface.addColumn(tableName, 'confirmed_pickup_date', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      }
      if (!table.pickup_reschedule_note) {
        await queryInterface.addColumn(tableName, 'pickup_reschedule_note', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface) {
    for (const tableName of ['quotations', 'purchase_orders']) {
      const table = await queryInterface.describeTable(tableName);
      if (table.pickup_date_status) await queryInterface.removeColumn(tableName, 'pickup_date_status');
      if (table.confirmed_pickup_date) await queryInterface.removeColumn(tableName, 'confirmed_pickup_date');
      if (table.pickup_reschedule_note) await queryInterface.removeColumn(tableName, 'pickup_reschedule_note');
    }
  },
};
