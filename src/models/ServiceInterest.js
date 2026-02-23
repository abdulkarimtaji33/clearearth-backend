/**
 * ServiceInterest Model
 */

module.exports = (sequelize, DataTypes) => {
  const ServiceInterest = sequelize.define(
    'ServiceInterest',
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
      tableName: 'service_interests',
      timestamps: true,
      underscored: true,
      paranoid: false,
    }
  );

  return ServiceInterest;
};
