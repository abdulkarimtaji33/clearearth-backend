/**
 * Permission Model
 */

module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    'Permission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'e.g., contacts.create, deals.read.own, deals.view_price',
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Must be a module from the MODULES registry (constants/index.js)',
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      scope: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'null (unscoped), "own", or "all" — record-visibility scope for this action',
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'permissions',
      timestamps: false,
      indexes: [
        { fields: ['module'] },
        { fields: ['action'] },
        { fields: ['name'], unique: true },
        { fields: ['module', 'action', 'scope'], unique: true, name: 'permissions_module_action_scope_unique' },
      ],
    }
  );

  Permission.associate = models => {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
    });
  };

  return Permission;
};
