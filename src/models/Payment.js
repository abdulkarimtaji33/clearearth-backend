/**
 * Payment Model
 */
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
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
      payment_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      payment_type: {
        type: DataTypes.ENUM('receipt', 'payment'),
        allowNull: false,
        comment: 'receipt = incoming, payment = outgoing',
      },
      payment_method: {
        type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD)),
        allowNull: false,
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        references: { model: 'invoices', key: 'id' },
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        references: { model: 'vendors', key: 'id' },
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'AED',
      },
      reference_number: {
        type: DataTypes.STRING(100),
      },
      bank_account: {
        type: DataTypes.STRING(100),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
        defaultValue: PAYMENT_STATUS.PENDING,
      },
      received_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'payments',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['payment_number'], unique: true },
        { fields: ['invoice_id'] },
        { fields: ['client_id'] },
        { fields: ['vendor_id'] },
        { fields: ['payment_date'] },
        { fields: ['status'] },
      ],
    }
  );

  Payment.associate = models => {
    Payment.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Payment.belongsTo(models.Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
    Payment.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Payment.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    Payment.belongsTo(models.User, { foreignKey: 'received_by', as: 'receiver' });
    Payment.hasOne(models.Cheque, { foreignKey: 'payment_id', as: 'cheque' });
  };

  return Payment;
};
