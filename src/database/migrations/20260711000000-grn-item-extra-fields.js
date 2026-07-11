'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('grn_items', 'make', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('grn_items', 'model', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('grn_items', 'serial_number', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('grn_items', 'units', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Optional piece count',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('grn_items', 'units');
    await queryInterface.removeColumn('grn_items', 'serial_number');
    await queryInterface.removeColumn('grn_items', 'model');
    await queryInterface.removeColumn('grn_items', 'make');
  },
};
