/**
 * DealInspectionReport Model - Inspection report for deals
 */

module.exports = (sequelize, DataTypes) => {
  const DealInspectionReport = sequelize.define(
    'DealInspectionReport',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      inspection_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approximate_weight: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      weight_uom: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      cargo_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      transportation_arrangement: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      approximate_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const val = this.getDataValue('images');
          return val ? JSON.parse(val) : [];
        },
        set(val) {
          this.setDataValue('images', val ? JSON.stringify(val) : null);
        },
      },
      inspector_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approved_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'deal_inspection_reports',
      timestamps: true,
      underscored: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['deal_id'] }],
    }
  );

  DealInspectionReport.associate = models => {
    DealInspectionReport.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    DealInspectionReport.belongsTo(models.User, { foreignKey: 'inspector_id', as: 'inspector' });
    DealInspectionReport.belongsTo(models.User, { foreignKey: 'approved_by_id', as: 'approvedBy' });
  };

  return DealInspectionReport;
};
