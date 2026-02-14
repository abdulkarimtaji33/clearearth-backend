/**
 * Invoice Model
 */
const { INVOICE_TYPE, INVOICE_STATUS, VAT_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      invoice_type: {
        type: DataTypes.ENUM(...Object.values(INVOICE_TYPE)),
        allowNull: false,
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        references: { model: 'vendors', key: 'id' },
      },
      deal_id: {
        type: DataTypes.INTEGER,
        references: { model: 'deals', key: 'id' },
      },
      lot_id: {
        type: DataTypes.INTEGER,
        references: { model: 'lots', key: 'id' },
      },
      invoice_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATE,
      },
      reference_number: {
        type: DataTypes.STRING(100),
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'AED',
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(15, 6),
        defaultValue: 1,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      vat_type: {
        type: DataTypes.ENUM(...Object.values(VAT_TYPE)),
        defaultValue: VAT_TYPE.STANDARD,
      },
      vat_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5,
      },
      vat_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      paid_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      balance_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      customs_exit_certificate: {
        type: DataTypes.STRING(100),
        comment: 'For zero-rated export transactions',
      },
      reverse_charge_notes: {
        type: DataTypes.TEXT,
        comment: 'For reverse charge mechanism',
      },
      payment_terms: {
        type: DataTypes.STRING(100),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(INVOICE_STATUS)),
        defaultValue: INVOICE_STATUS.DRAFT,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'invoices',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['invoice_number'], unique: true },
        { fields: ['client_id'] },
        { fields: ['vendor_id'] },
        { fields: ['deal_id'] },
        { fields: ['status'] },
        { fields: ['invoice_date'] },
      ],
    }
  );

  Invoice.associate = models => {
    Invoice.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Invoice.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Invoice.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    Invoice.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Invoice.belongsTo(models.Lot, { foreignKey: 'lot_id', as: 'lot' });
    Invoice.hasMany(models.InvoiceLine, { foreignKey: 'invoice_id', as: 'lines' });
    Invoice.hasMany(models.Payment, { foreignKey: 'invoice_id', as: 'payments' });
    Invoice.hasMany(models.Commission, { foreignKey: 'invoice_id', as: 'commissions' });
  };

  return Invoice;
};
