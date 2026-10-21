/**
 * UserPushToken Model - Expo push tokens registered by the mobile app
 */
module.exports = (sequelize, DataTypes) => {
  const UserPushToken = sequelize.define(
    'UserPushToken',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      platform: { type: DataTypes.STRING(20), allowNull: true },
    },
    {
      tableName: 'user_push_tokens',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  UserPushToken.associate = (models) => {
    UserPushToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return UserPushToken;
};
