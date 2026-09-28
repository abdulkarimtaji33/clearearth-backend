/**
 * Work Location Model
 */
module.exports = (sequelize, DataTypes) => {
  const WorkLocation = sequelize.define(
    'WorkLocation',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      name: { type: DataTypes.STRING(150), allowNull: false },
      address: { type: DataTypes.STRING(255), allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      geofence_radius_meters: { type: DataTypes.INTEGER, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'work_locations',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }],
    }
  );

  WorkLocation.associate = models => {
    WorkLocation.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    WorkLocation.hasMany(models.Employee, { foreignKey: 'work_location_id', as: 'employees' });
  };

  return WorkLocation;
};
