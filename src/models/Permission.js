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
        comment: 'e.g., contacts.create, companies.update, leads.delete',
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Optional sub-group within a module (e.g. hr -> employees)',
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_dangerous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_catalog: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True when defined in src/config/accessCatalog.js (enforced by the app)',
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
