/**
 * Outbound — one row per GRN (created automatically when the GRN is created, status "pending_outbound").
 * Never created by hand; it is only edited: type (disposed / sale / free_service), party, items, gatepass,
 * and the delivery-date request that sales send to operations.
 */
module.exports = (sequelize, DataTypes) => {
  const Outbound = sequelize.define(
    'Outbound',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      outbound_number: { type: DataTypes.STRING(30), allowNull: false },
      grn_id: { type: DataTypes.INTEGER, allowNull: false },
      deal_id: { type: DataTypes.INTEGER, allowNull: true },
      work_order_id: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending_outbound' },
      outbound_type: { type: DataTypes.STRING(20), allowNull: true },
      company_id: { type: DataTypes.INTEGER, allowNull: true },
      currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'AED' },
      supplier_id: { type: DataTypes.INTEGER, allowNull: true },
      vehicle_no: { type: DataTypes.STRING(50), allowNull: true },
      person_in_charge: { type: DataTypes.STRING(150), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      gatepass_number: { type: DataTypes.STRING(30), allowNull: true },
      gatepass_date: { type: DataTypes.DATEONLY, allowNull: true },
      inventory_released: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      requested_delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
      delivery_date_status: { type: DataTypes.STRING(30), allowNull: true },
      confirmed_delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
      delivery_reschedule_note: { type: DataTypes.TEXT, allowNull: true },
      delivery_notes: { type: DataTypes.TEXT, allowNull: true },
      delivery_requested_by: { type: DataTypes.INTEGER, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'outbounds', timestamps: true, paranoid: false, underscored: true }
  );

  Outbound.associate = (models) => {
    Outbound.belongsTo(models.Grn, { foreignKey: 'grn_id', as: 'grn' });
    Outbound.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
    Outbound.belongsTo(models.WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });
    Outbound.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Outbound.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Outbound.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    Outbound.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    Outbound.belongsTo(models.User, { foreignKey: 'delivery_requested_by', as: 'deliveryRequestedByUser' });
    Outbound.hasMany(models.OutboundItem, { foreignKey: 'outbound_id', as: 'items' });
    Outbound.hasMany(models.OutboundEvent, { foreignKey: 'outbound_id', as: 'events' });
  };

  return Outbound;
};
