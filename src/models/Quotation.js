/**
 * Quotation Model
 */
module.exports = (sequelize, DataTypes) => {
  const Quotation = sequelize.define(
    'Quotation',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      deal_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'deals', key: 'id' } },
      prepared_by: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      quotation_date: { type: DataTypes.DATEONLY, allowNull: false },
      quotation_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
      remarks: { type: DataTypes.TEXT },
    },
    {
      tableName: 'quotations',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_id'] },
        { fields: ['prepared_by'] },
        { fields: ['status'] },
      ],
    }
  );

  Quotation.associate = (models) => {
    Quotation.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Quotation.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Quotation.belongsTo(models.User, { foreignKey: 'prepared_by', as: 'preparedByUser' });
  };

  return Quotation;
};
