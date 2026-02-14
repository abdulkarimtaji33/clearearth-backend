/**
 * Job/Operations Model
 */
const { JOB_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define(
    'Job',
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
      job_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      job_type: {
        type: DataTypes.STRING(50),
        comment: 'Collection, Destruction, Recycling, ITAD, etc.',
      },
      description: {
        type: DataTypes.TEXT,
      },
      scheduled_date: {
        type: DataTypes.DATE,
      },
      start_date: {
        type: DataTypes.DATE,
      },
      completion_date: {
        type: DataTypes.DATE,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(JOB_STATUS)),
        defaultValue: JOB_STATUS.PENDING,
      },
      total_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'jobs',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['job_number'], unique: true },
        { fields: ['deal_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Job.associate = models => {
    Job.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Job.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Job.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Job.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Job.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    Job.hasMany(models.Inspection, { foreignKey: 'job_id', as: 'inspections' });
    Job.hasMany(models.GoodsReceiptNote, { foreignKey: 'job_id', as: 'grns' });
    Job.hasMany(models.Lot, { foreignKey: 'job_id', as: 'lots' });
  };

  return Job;
};
