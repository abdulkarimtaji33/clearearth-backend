/**
 * Leave Model
 */
const { LEAVE_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define(
    'Leave',
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
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      leave_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Annual, Sick, Unpaid, Emergency, etc.',
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      total_days: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(LEAVE_STATUS)),
        defaultValue: LEAVE_STATUS.PENDING,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'leaves',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['status'] },
        { fields: ['start_date', 'end_date'] },
      ],
    }
  );

  Leave.associate = models => {
    Leave.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Leave.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    Leave.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
  };

  return Leave;
};
