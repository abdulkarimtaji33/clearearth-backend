/**
 * General ledger expense (created when Accounts approves a work order task expense line)
 */
module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      work_order_task_expense_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
        references: { model: 'work_order_task_expenses', key: 'id' },
        comment: 'Null for manually posted ledger expenses',
      },
      category: { type: DataTypes.STRING(100), allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      expense_date: { type: DataTypes.DATEONLY, allowNull: false },
      paid_to: { type: DataTypes.STRING(255), allowNull: true },
      payment_method: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT },
      reference: { type: DataTypes.STRING(255), allowNull: true },
      reference_id: { type: DataTypes.STRING(255), allowNull: true },
      payment_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unpaid',
        comment: 'unpaid | partial | paid',
      },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      paid_at: { type: DataTypes.DATEONLY, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'expenses',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['expense_date'] },
        { fields: ['category'] },
        { fields: ['payment_status'] },
      ],
    }
  );

  Expense.associate = models => {
    Expense.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Expense.belongsTo(models.WorkOrderTaskExpense, { foreignKey: 'work_order_task_expense_id', as: 'taskExpense' });
    Expense.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return Expense;
};
