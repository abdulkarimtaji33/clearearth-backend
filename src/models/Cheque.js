/**
 * Cheque Model
 */
const { CHEQUE_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Cheque = sequelize.define(
    'Cheque',
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
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'payments', key: 'id' },
      },
      cheque_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      cheque_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      maturity_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Post-dated cheque maturity date',
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      deposited_date: {
        type: DataTypes.DATE,
      },
      cleared_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CHEQUE_STATUS)),
        defaultValue: CHEQUE_STATUS.ISSUED,
      },
      bounce_reason: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'cheques',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['payment_id'] },
        { fields: ['cheque_number'] },
        { fields: ['maturity_date'] },
        { fields: ['status'] },
      ],
    }
  );

  Cheque.associate = models => {
    Cheque.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Cheque.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
  };

  return Cheque;
};
