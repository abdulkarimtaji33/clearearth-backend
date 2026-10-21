'use strict';

/**
 * Documentation-only migration mirroring the schema created idempotently by
 * run-migration.js (the file the deploy process actually executes). Keep this
 * file in sync with the "user_push_tokens" section of run-migration.js.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_push_tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      platform: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('user_push_tokens', ['user_id'], { name: 'idx_upt_user' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_push_tokens');
  },
};
