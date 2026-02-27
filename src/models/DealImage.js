/**
 * DealImage Model - Images attached to deals
 */

module.exports = (sequelize, DataTypes) => {
  const DealImage = sequelize.define(
    'DealImage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'deal_images',
      timestamps: true,
      underscored: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['deal_id'] }],
    }
  );

  DealImage.associate = models => {
    DealImage.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
  };

  return DealImage;
};
