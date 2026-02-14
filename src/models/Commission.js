/**
 * Commission Model
 */
const { COMMISSION_STATUS, COMMISSION_BASIS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define(
    'Commission',
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
      commission_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      commission_policy_id: {
        type: DataTypes.INTEGER,
        references: { model: 'commission_policies', key: 'id' },
      },
      beneficiary_type: {
        type: DataTypes.ENUM('employee', 'agent'),
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        references: { model: 'employees', key: 'id' },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        references: { model: 'vendors', key: 'id' },
        comment: 'For third-party agents',
      },
      invoice_id: {
        type: DataTypes.INTEGER,
        references: { model: 'invoices', key: 'id' },
      },
      lot_id: {
        type: DataTypes.INTEGER,
        references: { model: 'lots', key: 'id' },
      },
      deal_id: {
        type: DataTypes.INTEGER,
        references: { model: 'deals', key: 'id' },
      },
      basis: {
        type: DataTypes.ENUM(...Object.values(COMMISSION_BASIS)),
        allowNull: false,
      },
      base_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Amount on which commission is calculated',
      },
      commission_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      commission_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      override_amount: {
        type: DataTypes.DECIMAL(15, 2),
        comment: 'Manual override if applicable',
      },
      final_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      calculation_date: {
        type: DataTypes.DATE,
      },
      payment_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(COMMISSION_STATUS)),
        defaultValue: COMMISSION_STATUS.PENDING,
      },
      reversal_reason: {
        type: DataTypes.TEXT,
      },
      reversed_at: {
        type: DataTypes.DATE,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'commissions',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['commission_number'], unique: true },
        { fields: ['employee_id'] },
        { fields: ['vendor_id'] },
        { fields: ['invoice_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Commission.associate = models => {
    Commission.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Commission.belongsTo(models.CommissionPolicy, { foreignKey: 'commission_policy_id', as: 'policy' });
    Commission.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    Commission.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    Commission.belongsTo(models.Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
    Commission.belongsTo(models.Lot, { foreignKey: 'lot_id', as: 'lot' });
    Commission.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
  };

  return Commission;
};
