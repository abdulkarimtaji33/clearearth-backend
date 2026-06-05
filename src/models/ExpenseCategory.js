/**
 * ExpenseCategory — tenant-scoped manual expense categories
 */
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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Slug stored on expenses.category',
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'expense_categories',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['tenant_id'] },
        { unique: true, fields: ['tenant_id', 'value'], name: 'uk_expense_categories_tenant_value' },
      ],
    }
  );

  ExpenseCategory.associate = (models) => {
    ExpenseCategory.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return ExpenseCategory;
};
