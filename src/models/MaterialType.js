/**
 * Material Type Model
 */
const { MATERIAL_CATEGORY } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const MaterialType = sequelize.define(
    'MaterialType',
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
      category: {
        type: DataTypes.ENUM(...Object.values(MATERIAL_CATEGORY)),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_hazardous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recycling_rate: {
        type: DataTypes.DECIMAL(5, 2),
        comment: 'Expected recycling recovery rate',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'material_types',
      indexes: [{ fields: ['tenant_id'] }, { fields: ['category'] }],
    }
  );

  MaterialType.associate = models => {
    MaterialType.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return MaterialType;
};
