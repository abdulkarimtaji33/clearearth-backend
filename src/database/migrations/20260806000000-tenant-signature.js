'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('tenants');
    if (!table.signature) {
      await queryInterface.addColumn('tenants', 'signature', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Relative upload path to the authorised signature image, stamped onto quotations/POs',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('tenants');
    if (table.signature) {
      await queryInterface.removeColumn('tenants', 'signature');
    }
  },
};
