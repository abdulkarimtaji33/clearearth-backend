/**
 * Per-user permission override: grant or revoke a single permission on top of the user's role.
 */
module.exports = (sequelize, DataTypes) => {
  const UserPermissionOverride = sequelize.define(
    'UserPermissionOverride',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      permission_id: { type: DataTypes.INTEGER, allowNull: false },
      effect: { type: DataTypes.ENUM('grant', 'revoke'), allowNull: false },
      reason: { type: DataTypes.STRING(255) },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'user_permission_overrides',
      paranoid: false,
      indexes: [{ fields: ['user_id', 'permission_id'], unique: true }, { fields: ['tenant_id'] }],
    }
  );

  UserPermissionOverride.associate = (models) => {
    UserPermissionOverride.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserPermissionOverride.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
  };

  return UserPermissionOverride;
};
