'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchase_orders', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Sales user who created this PO/quotation; used for sales role scoping',
    });
    await queryInterface.addIndex('purchase_orders', ['created_by'], {
      name: 'idx_po_created_by',
    });
    await queryInterface.sequelize.query(`
      UPDATE purchase_orders po
      INNER JOIN deals d ON po.deal_id = d.id
      SET po.created_by = d.assigned_to
      WHERE po.created_by IS NULL AND d.assigned_to IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('purchase_orders', 'idx_po_created_by');
    await queryInterface.removeColumn('purchase_orders', 'created_by');
  },
};
