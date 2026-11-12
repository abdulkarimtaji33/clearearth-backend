/** SupplierAdvanceApplication — one adjustment of an advance against a supplier bill. */
module.exports = (sequelize, DataTypes) => {
  const SupplierAdvanceApplication = sequelize.define(
    'SupplierAdvanceApplication',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      advance_id: { type: DataTypes.INTEGER, allowNull: false },
      vendor_bill_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      applied_at: { type: DataTypes.DATEONLY, allowNull: false },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'supplier_advance_applications', timestamps: true, paranoid: false, underscored: true }
  );

  SupplierAdvanceApplication.associate = (models) => {
    SupplierAdvanceApplication.belongsTo(models.SupplierAdvance, { foreignKey: 'advance_id', as: 'advance' });
    SupplierAdvanceApplication.belongsTo(models.VendorBill, { foreignKey: 'vendor_bill_id', as: 'vendorBill' });
  };

  return SupplierAdvanceApplication;
};
