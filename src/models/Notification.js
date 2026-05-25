/**
 * Notification Model - In-app notifications for users
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['tenant_id', 'user_id', 'is_read'] },
        { fields: ['tenant_id', 'user_id', 'created_at'] },
      ],
    }
  );

  Notification.associate = models => {
    Notification.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Notification;
};
