module.exports = (sequelize, DataTypes) => {
  const CarbonFootprintFactor = sequelize.define(
    'CarbonFootprintFactor',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      material_type_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'NULL = tenant-wide default fallback' },
      co2_factor_per_ton: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 50 },
      liters_factor_per_ton: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 100 },
      kg_factor_per_ton: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 500 },
    },
    {
      tableName: 'carbon_footprint_factors',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  CarbonFootprintFactor.associate = (models) => {
    CarbonFootprintFactor.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    CarbonFootprintFactor.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
  };

  return CarbonFootprintFactor;
};
