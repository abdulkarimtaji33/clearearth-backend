module.exports = (sequelize, DataTypes) => {
  const GrnImage = sequelize.define(
    'GrnImage',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      grn_id: { type: DataTypes.INTEGER, allowNull: false },
      image_url: { type: DataTypes.STRING(500), allowNull: false },
      original_name: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'grn_images',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  GrnImage.associate = (models) => {
    GrnImage.belongsTo(models.Grn, { foreignKey: 'grn_id', as: 'grn' });
  };

  return GrnImage;
};
