module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('terms_and_conditions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('terms_and_conditions', ['tenant_id']);
    await queryInterface.addIndex('terms_and_conditions', ['status']);
    await queryInterface.addIndex('terms_and_conditions', ['is_default']);

    await queryInterface.addColumn('deals', 'terms_and_conditions_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'terms_and_conditions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('deals', ['terms_and_conditions_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('deals', 'terms_and_conditions_id');
    await queryInterface.dropTable('terms_and_conditions');
  },
};
