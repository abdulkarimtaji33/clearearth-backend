/**
 * DealStatus Model
 */

module.exports = (sequelize, DataTypes) => {
  const DealStatus = sequelize.define(
    'DealStatus',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'deal_statuses',
      timestamps: true,
      underscored: true,
      paranoid: false,
    }
  );

  return DealStatus;
};
