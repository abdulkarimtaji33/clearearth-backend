/**
 * Deal Stage History Model
 */
module.exports = (sequelize, DataTypes) => {
  const DealStage = sequelize.define(
    'DealStage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
      },
      stage_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      handler_user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      completed_at: {
        type: DataTypes.DATE,
      },
      is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'deal_stages',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_id'] },
        { fields: ['is_completed'] },
      ],
    }
  );

  DealStage.associate = models => {
    DealStage.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    DealStage.belongsTo(models.User, { foreignKey: 'handler_user_id', as: 'handler' });
  };

  return DealStage;
};
