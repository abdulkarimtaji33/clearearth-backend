module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products_services', 'type', {
      type: Sequelize.ENUM('product', 'service'),
      allowNull: false,
      defaultValue: 'product',
      after: 'name',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products_services', 'type');
  },
};
