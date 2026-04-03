'use strict';

/**
 * Migration: Update statuses for Deal, InspectionRequest, Quotation, PurchaseOrder
 *
 * Deal statuses: new, approved, quotation_sent, negotiation, won, lost
 *   + loss_reason column
 * Inspection request: add status column (request_submitted, team_assigned, inspection_completed, report_submitted)
 * Quotation statuses: new, sent, under_review, revised, approved, rejected
 * PurchaseOrder statuses: new, sent, under_review, revised, approved, rejected (same)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. Deal: change ENUM ──────────────────────────────────────────────────
    // MySQL: modify ENUM column
    await queryInterface.sequelize.query(`
      ALTER TABLE deals
        MODIFY COLUMN status ENUM('new','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new'
    `);

    // Map old values to new
    await queryInterface.sequelize.query(`
      UPDATE deals SET status = 'new'
      WHERE status NOT IN ('new','approved','quotation_sent','negotiation','won','lost')
    `);

    // Add loss_reason column
    await queryInterface.addColumn('deals', 'loss_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'status',
    });

    // ── 2. Update deal_statuses lookup table ──────────────────────────────────
    await queryInterface.sequelize.query(`DELETE FROM deal_statuses`);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await queryInterface.sequelize.query(`
      INSERT INTO deal_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
        ('new',            'New',             1, 1, '${now}', '${now}'),
        ('approved',       'Approved',        2, 1, '${now}', '${now}'),
        ('quotation_sent', 'Quotation Sent',  3, 1, '${now}', '${now}'),
        ('negotiation',    'Negotiation',     4, 1, '${now}', '${now}'),
        ('won',            'Won',             5, 1, '${now}', '${now}'),
        ('lost',           'Lost',            6, 1, '${now}', '${now}')
    `);

    // ── 3. DealInspectionRequest: add status column ───────────────────────────
    await queryInterface.addColumn('deal_inspection_requests', 'status', {
      type: Sequelize.ENUM('request_submitted', 'team_assigned', 'inspection_completed', 'report_submitted'),
      allowNull: false,
      defaultValue: 'request_submitted',
      after: 'notes',
    });

    // ── 4. Update quotation_statuses lookup table ─────────────────────────────
    await queryInterface.sequelize.query(`DELETE FROM quotation_statuses`);
    await queryInterface.sequelize.query(`
      INSERT INTO quotation_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
        ('new',          'New',          1, 1, '${now}', '${now}'),
        ('sent',         'Sent',         2, 1, '${now}', '${now}'),
        ('under_review', 'Under Review', 3, 1, '${now}', '${now}'),
        ('revised',      'Revised',      4, 1, '${now}', '${now}'),
        ('approved',     'Approved',     5, 1, '${now}', '${now}'),
        ('rejected',     'Rejected',     6, 1, '${now}', '${now}')
    `);

    // Remap old quotation statuses
    await queryInterface.sequelize.query(`
      UPDATE quotations SET status = 'new'
      WHERE status NOT IN ('new','sent','under_review','revised','approved','rejected')
    `);

    // ── 5. Update purchase_order_statuses lookup table ────────────────────────
    // PurchaseOrderStatus table may or may not exist; use same values as quotation
    try {
      await queryInterface.sequelize.query(`DELETE FROM purchase_order_statuses`);
      await queryInterface.sequelize.query(`
        INSERT INTO purchase_order_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
          ('new',          'New',          1, 1, '${now}', '${now}'),
          ('sent',         'Sent',         2, 1, '${now}', '${now}'),
          ('under_review', 'Under Review', 3, 1, '${now}', '${now}'),
          ('revised',      'Revised',      4, 1, '${now}', '${now}'),
          ('approved',     'Approved',     5, 1, '${now}', '${now}'),
          ('rejected',     'Rejected',     6, 1, '${now}', '${now}')
      `);
      await queryInterface.sequelize.query(`
        UPDATE purchase_orders SET status = 'new'
        WHERE status NOT IN ('new','sent','under_review','revised','approved','rejected')
      `);
    } catch (e) {
      console.warn('purchase_order_statuses table not found, skipping:', e.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert deal status ENUM
    await queryInterface.sequelize.query(`
      UPDATE deals SET status = 'draft'
      WHERE status NOT IN ('draft','pending','approved','in_progress','completed','cancelled')
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE deals
        MODIFY COLUMN status ENUM('draft','pending','approved','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft'
    `);
    await queryInterface.removeColumn('deals', 'loss_reason');

    // Revert deal_statuses
    await queryInterface.sequelize.query(`DELETE FROM deal_statuses`);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await queryInterface.sequelize.query(`
      INSERT INTO deal_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
        ('draft',       'Draft',           1, 1, '${now}', '${now}'),
        ('pending',     'Pending Approval',2, 1, '${now}', '${now}'),
        ('approved',    'Approved',        3, 1, '${now}', '${now}'),
        ('in_progress', 'In Progress',     4, 1, '${now}', '${now}'),
        ('completed',   'Completed',       5, 1, '${now}', '${now}'),
        ('cancelled',   'Cancelled',       6, 1, '${now}', '${now}')
    `);

    // Remove inspection request status
    await queryInterface.removeColumn('deal_inspection_requests', 'status');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_deal_inspection_requests_status`);

    // Revert quotation_statuses
    await queryInterface.sequelize.query(`DELETE FROM quotation_statuses`);
    await queryInterface.sequelize.query(`
      INSERT INTO quotation_statuses (value, display_name, display_order, is_active, created_at, updated_at) VALUES
        ('draft',    'Draft',    1, 1, '${now}', '${now}'),
        ('approved', 'Approved', 2, 1, '${now}', '${now}')
    `);
  },
};
