'use strict';

/**
 * Documentation-only migration mirroring the schema created idempotently by
 * run-migration.js (the file the deploy process actually executes — this
 * folder is not auto-discovered by the deploy pipeline). Keep this file in
 * sync with the "Certificate Management Module" section of run-migration.js.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('certificate_requests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      grn_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'grns', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      deal_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'deals', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      company_name: { type: Sequelize.STRING(200), allowNull: false },
      contact_person: { type: Sequelize.STRING(150), allowNull: false },
      contact_no: { type: Sequelize.STRING(30), allowNull: false },
      contact_email: { type: Sequelize.STRING(150), allowNull: false },
      collection_date: { type: Sequelize.DATEONLY, allowNull: false },
      grn_no: { type: Sequelize.STRING(50), allowNull: true },
      material_waste_details: { type: Sequelize.TEXT, allowNull: false },
      total_weight_quantity: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      invoice_no: { type: Sequelize.STRING(100), allowNull: true },
      additional_notes: { type: Sequelize.TEXT, allowNull: true },
      destruction_report_variant: { type: Sequelize.ENUM('itemized_equipment', 'bulk_material'), allowNull: true },
      wds_ref_no: { type: Sequelize.STRING(100), allowNull: true },
      doc_ref: { type: Sequelize.STRING(100), allowNull: true },
      req_no: { type: Sequelize.STRING(100), allowNull: true },
      boe_no: { type: Sequelize.STRING(100), allowNull: true },
      barcode: { type: Sequelize.STRING(100), allowNull: true },
      requested_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'SET NULL', onDelete: 'SET NULL' },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'pending_verification' },
      verified_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'SET NULL', onDelete: 'SET NULL' },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      verification_notes: { type: Sequelize.TEXT, allowNull: true },
      material_type_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'material_types', key: 'id' }, onUpdate: 'SET NULL', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('certificate_request_types', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_request_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'certificate_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      type: {
        type: Sequelize.ENUM('green_certificate', 'certificate_of_destruction', 'certificate_of_data_destruction', 'carbon_footprint', 'destruction_report_evidence'),
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('certificate_request_attachments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_request_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'certificate_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: true },
      file_type: { type: Sequelize.ENUM('grn_report', 'wds', 'destruction_photo', 'other'), allowNull: false, defaultValue: 'other' },
      photo_stage: { type: Sequelize.ENUM('arrival', 'destruction_in_progress', 'other'), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('certificates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      certificate_request_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'certificate_requests', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      type: {
        type: Sequelize.ENUM('green_certificate', 'certificate_of_destruction', 'certificate_of_data_destruction', 'carbon_footprint', 'destruction_report_evidence'),
        allowNull: false,
      },
      certificate_number: { type: Sequelize.STRING(60), allowNull: false },
      issued_date: { type: Sequelize.DATEONLY, allowNull: true },
      pdf_path: { type: Sequelize.STRING(500), allowNull: true },
      generated_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'SET NULL', onDelete: 'SET NULL' },
      co2_saved: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      liters_saved: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      kg_saved: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('certificate_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'certificates', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      sl_no: { type: Sequelize.INTEGER, allowNull: true },
      description: { type: Sequelize.STRING(255), allowNull: false },
      qty: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      unit: { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'nos' },
      manufacturer: { type: Sequelize.STRING(100), allowNull: true },
      model_no: { type: Sequelize.STRING(100), allowNull: true },
      serial_no: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('carbon_footprint_factors', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      material_type_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'material_types', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      co2_factor_per_ton: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 50 },
      liters_factor_per_ton: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 100 },
      kg_factor_per_ton: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 500 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('certificate_requests', ['tenant_id']);
    await queryInterface.addIndex('certificate_requests', ['status']);
    await queryInterface.addIndex('certificate_requests', ['grn_id']);
    await queryInterface.addIndex('certificate_request_types', ['certificate_request_id']);
    await queryInterface.addIndex('certificate_request_attachments', ['certificate_request_id']);
    await queryInterface.addIndex('certificates', ['tenant_id']);
    await queryInterface.addIndex('certificates', ['certificate_number']);
    await queryInterface.addIndex('certificate_items', ['certificate_id']);
    await queryInterface.addIndex('carbon_footprint_factors', ['tenant_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('carbon_footprint_factors');
    await queryInterface.dropTable('certificate_items');
    await queryInterface.dropTable('certificates');
    await queryInterface.dropTable('certificate_request_attachments');
    await queryInterface.dropTable('certificate_request_types');
    await queryInterface.dropTable('certificate_requests');
  },
};
