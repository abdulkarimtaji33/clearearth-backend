/**
 * Depreciation Model
 */
module.exports = (sequelize, DataTypes) => {
  const Depreciation = sequelize.define(
    'Depreciation',
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
      asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'fixed_assets', key: 'id' },
      },
      depreciation_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      depreciation_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      accumulated_depreciation: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      book_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      journal_entry_id: {
        type: DataTypes.INTEGER,
        references: { model: 'journal_entries', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'depreciations',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['asset_id'] },
        { fields: ['depreciation_date'] },
      ],
    }
  );

  Depreciation.associate = models => {
    Depreciation.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Depreciation.belongsTo(models.FixedAsset, { foreignKey: 'asset_id', as: 'asset' });
    Depreciation.belongsTo(models.JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
  };

  return Depreciation;
};
