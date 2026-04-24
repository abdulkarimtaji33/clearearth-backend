'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('deals', 'is_rcm_applicable', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Reverse Charge Mechanism: VAT paid to government by buyer, excluded from purchase documents',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('deals', 'is_rcm_applicable');
  },
};
