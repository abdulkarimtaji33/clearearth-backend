/** StorageFacility — where received goods are stored (Sajha, DIC B03, DIC H09 ...). */
module.exports = (sequelize, DataTypes) => {
  const StorageFacility = sequelize.define(
    'StorageFacility',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'storage_facilities', timestamps: true, paranoid: false, underscored: true }
  );
  return StorageFacility;
};
