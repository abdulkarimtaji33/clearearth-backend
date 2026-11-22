/**
 * Field visibility per role. A row with visible=false hides that field group from the role.
 */
module.exports = (sequelize, DataTypes) => {
  const RoleFieldRule = sequelize.define(
    'RoleFieldRule',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: { type: DataTypes.INTEGER, allowNull: false },
      field_group: { type: DataTypes.STRING(50), allowNull: false },
      visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'role_field_rules',
      paranoid: false,
      indexes: [{ fields: ['role_id', 'field_group'], unique: true }],
    }
  );

  RoleFieldRule.associate = (models) => {
    RoleFieldRule.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
  };

  return RoleFieldRule;
};
