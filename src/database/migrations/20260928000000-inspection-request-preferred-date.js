'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('deal_inspection_requests');
    if (!table.preferred_inspection_date) {
      await queryInterface.addColumn('deal_inspection_requests', 'preferred_inspection_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Preferred date for inspection requested at submission time',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('deal_inspection_requests');
    if (table.preferred_inspection_date) {
      await queryInterface.removeColumn('deal_inspection_requests', 'preferred_inspection_date');
    }
  },
};
