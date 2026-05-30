'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('deals', 'pickup_location', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Google Maps URL for collection',
    });
    await queryInterface.addColumn('deals', 'pickup_contact_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('deals', 'pickup_contact_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('deals', 'pickup_contact_number');
    await queryInterface.removeColumn('deals', 'pickup_contact_name');
    await queryInterface.removeColumn('deals', 'pickup_location');
  },
};
