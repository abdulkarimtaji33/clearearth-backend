/**
 * SupplierAdvance — money paid to a supplier before its bill exists.
 * Recording: Dr 1350 Advances to Suppliers / Cr the cash or bank account.
 * Applying to a bill: Dr 2000 Accounts Payable / Cr 1350.
 */
module.exports = (sequelize, DataTypes) => {
  const SupplierAdvance = sequelize.define(
    'SupplierAdvance',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      advance_number: { type: DataTypes.STRING(30), allowNull: false },
      supplier_id: { type: DataTypes.INTEGER, allowNull: false },
      advance_date: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      applied_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      payment_account_id: { type: DataTypes.INTEGER, allowNull: true },
      payment_method: { type: DataTypes.STRING(100), allowNull: true },
      reference_no: { type: DataTypes.STRING(100), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'supplier_advances', timestamps: true, paranoid: false, underscored: true }
  );

  SupplierAdvance.associate = (models) => {
    SupplierAdvance.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    SupplierAdvance.belongsTo(models.ChartOfAccounts, { foreignKey: 'payment_account_id', as: 'paymentAccount' });
    SupplierAdvance.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return SupplierAdvance;
};
