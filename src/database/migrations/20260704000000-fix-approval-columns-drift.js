'use strict';

/**
 * Fixes schema drift: the Deal/Quotation/PurchaseOrder models have required
 * approval_requested_at/approved_by/approved_at fields (used by the
 * approve/request-approval/approve-with-pin flows in deal.service.js,
 * quotation.service.js, purchaseOrder.service.js) that no prior migration
 * ever added to these three tables — only leads and grn got them. Also
 * restores 'pending_approval' to deals.status, which the Deal model has
 * expected since the approval-PIN workflow was added but which
 * 20260403000000-update-statuses.js dropped from the ENUM.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const approvalColumns = {
      approval_requested_at: { type: Sequelize.DATE, allowNull: true },
      approved_by: { type: Sequelize.INTEGER, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
    };

    for (const table of ['deals', 'quotations', 'purchase_orders']) {
      const columns = await queryInterface.describeTable(table);
      for (const [name, definition] of Object.entries(approvalColumns)) {
        if (!columns[name]) {
          await queryInterface.addColumn(table, name, definition);
        }
      }
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE deals
      MODIFY COLUMN status ENUM('new','pending_approval','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE deals SET status = 'new' WHERE status = 'pending_approval'
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE deals
      MODIFY COLUMN status ENUM('new','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new'
    `);

    for (const table of ['deals', 'quotations', 'purchase_orders']) {
      const columns = await queryInterface.describeTable(table);
      for (const name of ['approval_requested_at', 'approved_by', 'approved_at']) {
        if (columns[name]) {
          await queryInterface.removeColumn(table, name);
        }
      }
    }
  },
};
