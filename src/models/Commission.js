/**
 * Commission Model - one row per quotation approval that generates sales commission
 */
module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define(
    'Commission',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      quotation_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'quotations', key: 'id' } },
      deal_id: { type: DataTypes.INTEGER, allowNull: true },
      quotation_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      commission_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      commission_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      status: { type: DataTypes.ENUM('accrued', 'paid', 'in_payroll'), allowNull: false, defaultValue: 'accrued' },
      payslip_id: { type: DataTypes.INTEGER, allowNull: true },
      journal_entry_id: { type: DataTypes.INTEGER, allowNull: true },
      paid_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'commissions',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['user_id'] },
        { fields: ['status'] },
        { unique: true, fields: ['tenant_id', 'quotation_id'] },
      ],
    }
  );

  Commission.associate = (models) => {
    Commission.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Commission.belongsTo(models.Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
    Commission.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Commission.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
  };

  return Commission;
};
