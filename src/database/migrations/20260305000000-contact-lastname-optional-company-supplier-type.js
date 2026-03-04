'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('contacts', 'last_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('companies', 'type', {
      type: Sequelize.ENUM('individual', 'organization'),
      allowNull: true,
      defaultValue: 'organization',
    });

    await queryInterface.addColumn('suppliers', 'type', {
      type: Sequelize.ENUM('individual', 'organization'),
      allowNull: true,
      defaultValue: 'organization',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('contacts', 'last_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    await queryInterface.removeColumn('companies', 'type');
    await queryInterface.removeColumn('suppliers', 'type');
  },
};
