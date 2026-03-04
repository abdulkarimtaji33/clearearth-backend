/**
 * QuotationStatus Model - Dropdown for quotation status
 */
module.exports = (sequelize, DataTypes) => {
  const QuotationStatus = sequelize.define(
    'QuotationStatus',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      value: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      display_name: { type: DataTypes.STRING(100), allowNull: false },
      display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'quotation_statuses', timestamps: true, underscored: true, paranoid: false }
  );
  return QuotationStatus;
};
