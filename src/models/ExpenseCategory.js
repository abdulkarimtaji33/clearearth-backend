/**
 * Expense Category Model
 */
const { EXPENSE_DEDUCTIBILITY } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const ExpenseCategory = sequelize.define(
    'ExpenseCategory',
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      deductibility: {
        type: DataTypes.ENUM(...Object.values(EXPENSE_DEDUCTIBILITY)),
        defaultValue: EXPENSE_DEDUCTIBILITY.FULLY_DEDUCTIBLE,
      },
      deductible_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 100,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'expense_categories',
      indexes: [{ fields: ['tenant_id'] }],
    }
  );

  ExpenseCategory.associate = models => {
    ExpenseCategory.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return ExpenseCategory;
};
