'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.designation) {
      await queryInterface.addColumn('users', 'designation', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Optional job title/designation shown on documents',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    if (table.designation) {
      await queryInterface.removeColumn('users', 'designation');
    }
  },
};
