'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE contacts
      MODIFY contact_type ENUM('clients', 'vendors', 'both') DEFAULT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE contacts SET contact_type = 'clients' WHERE contact_type = 'both'
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE contacts
      MODIFY contact_type ENUM('clients', 'vendors') DEFAULT NULL
    `);
  },
};
