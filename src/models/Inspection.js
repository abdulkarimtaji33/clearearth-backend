/**
 * Inspection Model
 */
const { INSPECTION_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Inspection = sequelize.define(
    'Inspection',
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
      inspection_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' },
      },
      inspection_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      inspector_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      inspection_type: {
        type: DataTypes.STRING(50),
      },
      findings: {
        type: DataTypes.TEXT,
      },
      recommendations: {
        type: DataTypes.TEXT,
      },
      photos: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM(...Object.values(INSPECTION_STATUS)),
        defaultValue: INSPECTION_STATUS.PENDING,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'inspections',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['inspection_number'], unique: true },
        { fields: ['job_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Inspection.associate = models => {
    Inspection.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Inspection.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
    Inspection.belongsTo(models.User, { foreignKey: 'inspector_id', as: 'inspector' });
  };

  return Inspection;
};
