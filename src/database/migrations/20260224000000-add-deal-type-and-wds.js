module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('deals', 'deal_type', {
      type: Sequelize.ENUM('offer_to_charge', 'offer_to_purchase', 'free_of_charge'),
      allowNull: false,
      defaultValue: 'offer_to_charge',
      after: 'terms_and_conditions_id',
    });

    await queryInterface.addColumn('deals', 'container_type', {
      type: Sequelize.ENUM('LCL', 'FCL'),
      allowNull: true,
      after: 'deal_type',
    });

    await queryInterface.addColumn('deals', 'location_type', {
      type: Sequelize.ENUM('Main Land', 'Free Zone'),
      allowNull: true,
      after: 'container_type',
    });

    await queryInterface.addColumn('deals', 'wds_required', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'location_type',
    });

    await queryInterface.addColumn('deals', 'inspection_required', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'wds_required',
    });

    await queryInterface.addColumn('deals', 'custom_inspection', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'inspection_required',
    });

    await queryInterface.addColumn('deals', 'trakhees_inspection', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'custom_inspection',
    });

    await queryInterface.addColumn('deals', 'dubai_municipality_inspection', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'trakhees_inspection',
    });

    await queryInterface.createTable('deal_wds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ref_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      license_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      waste_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      source_process: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      package_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      quantity_per_package: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      total_weight: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      container_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bl_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bor_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
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

    await queryInterface.addIndex('deal_wds', ['deal_id']);
    await queryInterface.addIndex('deal_wds', ['ref_no']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('deal_wds');
    await queryInterface.removeColumn('deals', 'dubai_municipality_inspection');
    await queryInterface.removeColumn('deals', 'trakhees_inspection');
    await queryInterface.removeColumn('deals', 'custom_inspection');
    await queryInterface.removeColumn('deals', 'inspection_required');
    await queryInterface.removeColumn('deals', 'wds_required');
    await queryInterface.removeColumn('deals', 'location_type');
    await queryInterface.removeColumn('deals', 'container_type');
    await queryInterface.removeColumn('deals', 'deal_type');
  },
};
