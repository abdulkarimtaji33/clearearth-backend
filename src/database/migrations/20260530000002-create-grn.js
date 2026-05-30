'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grns', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      grn_number: { type: Sequelize.STRING(50), allowNull: false },
      work_order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deal_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'deals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'draft | submitted | approved',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('grn_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      grn_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'grns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_name: { type: Sequelize.STRING(255), allowNull: false },
      material_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'material_types', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      quantity: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unit_of_measure: { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'kg' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('grn_images', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      grn_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'grns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      image_url: { type: Sequelize.STRING(500), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('grns', ['tenant_id']);
    await queryInterface.addIndex('grns', ['grn_number']);
    await queryInterface.addIndex('grns', ['work_order_id']);
    await queryInterface.addIndex('grn_items', ['grn_id']);
    await queryInterface.addIndex('grn_images', ['grn_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('grn_images');
    await queryInterface.dropTable('grn_items');
    await queryInterface.dropTable('grns');
  },
};
