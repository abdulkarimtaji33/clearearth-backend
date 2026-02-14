/**
 * Deal Model
 */
const { DEAL_STATUS, DEAL_TYPE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Deal = sequelize.define(
    'Deal',
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
      deal_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      lead_id: {
        type: DataTypes.INTEGER,
        references: { model: 'leads', key: 'id' },
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      deal_type: {
        type: DataTypes.ENUM(...Object.values(DEAL_TYPE)),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      service_type: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      expected_value: {
        type: DataTypes.DECIMAL(15, 2),
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'AED',
      },
      expected_closure_date: {
        type: DataTypes.DATE,
      },
      actual_closure_date: {
        type: DataTypes.DATE,
      },
      probability: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        validate: { min: 0, max: 100 },
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      current_stage: {
        type: DataTypes.STRING(50),
        defaultValue: 'sales',
      },
      current_department: {
        type: DataTypes.STRING(50),
        defaultValue: 'sales',
      },
      handler_user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(DEAL_STATUS)),
        defaultValue: DEAL_STATUS.DRAFT,
      },
      won_reason: {
        type: DataTypes.TEXT,
      },
      lost_reason: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      finalized_at: {
        type: DataTypes.DATE,
      },
      finalized_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'deals',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_number'], unique: true },
        { fields: ['client_id'] },
        { fields: ['assigned_to'] },
        { fields: ['status'] },
        { fields: ['deal_type'] },
      ],
    }
  );

  Deal.associate = models => {
    Deal.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Deal.belongsTo(models.Lead, { foreignKey: 'lead_id', as: 'lead' });
    Deal.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Deal.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Deal.belongsTo(models.User, { foreignKey: 'handler_user_id', as: 'currentHandler' });
    Deal.hasMany(models.DealStage, { foreignKey: 'deal_id', as: 'stages' });
    Deal.hasMany(models.Job, { foreignKey: 'deal_id', as: 'jobs' });
  };

  return Deal;
};
