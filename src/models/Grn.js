module.exports = (sequelize, DataTypes) => {
  const Grn = sequelize.define(
    'Grn',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      grn_number: { type: DataTypes.STRING(50), allowNull: false },
      work_order_id: { type: DataTypes.INTEGER, allowNull: true },
      deal_id: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      storage_facility_id: { type: DataTypes.INTEGER, allowNull: true },
      driver_comment: { type: DataTypes.TEXT, allowNull: true },
      disposed_without_facility: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      approved_by: { type: DataTypes.INTEGER, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'grns',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  Grn.associate = (models) => {
    Grn.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Grn.belongsTo(models.WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });
    Grn.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Grn.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    Grn.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approvedByUser' });
    Grn.hasMany(models.GrnItem, { foreignKey: 'grn_id', as: 'items' });
    Grn.belongsTo(models.StorageFacility, { foreignKey: 'storage_facility_id', as: 'storageFacility' });
  };

  return Grn;
};
