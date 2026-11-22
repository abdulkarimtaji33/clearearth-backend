/**
 * Data scope per role and module (own / team / all). Missing row = the module's default (all).
 */
module.exports = (sequelize, DataTypes) => {
  const RoleDataScope = sequelize.define(
    'RoleDataScope',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: { type: DataTypes.INTEGER, allowNull: false },
      module_key: { type: DataTypes.STRING(50), allowNull: false },
      scope: { type: DataTypes.STRING(20), allowNull: false },
    },
    {
      tableName: 'role_data_scopes',
      paranoid: false,
      indexes: [{ fields: ['role_id', 'module_key'], unique: true }],
    }
  );

  RoleDataScope.associate = (models) => {
    RoleDataScope.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
  };

  return RoleDataScope;
};
