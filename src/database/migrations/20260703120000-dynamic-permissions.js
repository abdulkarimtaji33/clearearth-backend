'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // module: drop the fixed ENUM (blocked adding new modules without a migration) -> VARCHAR
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions
      MODIFY COLUMN module VARCHAR(50) NOT NULL
    `);

    // action: drop the fixed ENUM -> VARCHAR, allow custom action strings per module
    await queryInterface.sequelize.query(`
      ALTER TABLE permissions
      MODIFY COLUMN action VARCHAR(50) NOT NULL
    `);

    // scope: null (unscoped), 'own', or 'all' — lets a role hold module.action.own
    // separately from module.action.all instead of one flat module.action switch.
    await queryInterface.addColumn('permissions', 'scope', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'action',
    });

    // name stayed unique on its own; module+action+scope was not previously unique
    // because module/action alone weren't enough to disambiguate scoped permissions.
    await queryInterface.addIndex('permissions', {
      fields: ['module', 'action', 'scope'],
      unique: true,
      name: 'permissions_module_action_scope_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('permissions', 'permissions_module_action_scope_unique');
    await queryInterface.removeColumn('permissions', 'scope');

    await queryInterface.sequelize.query(`
      ALTER TABLE permissions
      MODIFY COLUMN action ENUM('create', 'read', 'update', 'delete', 'approve', 'reject') NOT NULL
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE permissions
      MODIFY COLUMN module ENUM('users', 'roles', 'contacts', 'companies', 'suppliers', 'leads', 'products', 'deals', 'inspection_requests', 'inspection_reports') NOT NULL
    `);
  },
};
