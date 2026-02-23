/**
 * Permission Model
 */
const { MODULES, ACTIONS } = require('../constants');

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
        comment: 'e.g., contacts.create, companies.update, leads.delete',
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      module: {
        type: DataTypes.ENUM(...Object.values(MODULES)),
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(...Object.values(ACTIONS)),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'permissions',
      timestamps: false,
      indexes: [{ fields: ['module'] }, { fields: ['action'] }, { fields: ['name'], unique: true }],
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
