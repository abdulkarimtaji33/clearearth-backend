module.exports = (sequelize, DataTypes) => {
  const GrnItem = sequelize.define(
    'GrnItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      grn_id: { type: DataTypes.INTEGER, allowNull: false },
      item_name: { type: DataTypes.STRING(255), allowNull: false },
      material_type_id: { type: DataTypes.INTEGER, allowNull: true },
      quantity: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unit_of_measure: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'kg' },
      make: { type: DataTypes.STRING(255), allowNull: true },
      model: { type: DataTypes.STRING(255), allowNull: true },
      serial_number: { type: DataTypes.STRING(255), allowNull: true },
      units: { type: DataTypes.INTEGER, allowNull: true, comment: 'Optional piece count' },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'grn_items',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  GrnItem.associate = (models) => {
    GrnItem.belongsTo(models.Grn, { foreignKey: 'grn_id', as: 'grn' });
    GrnItem.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
    GrnItem.hasMany(models.GrnImage, { foreignKey: 'grn_item_id', as: 'images' });
  };

  return GrnItem;
};
