/** PickupRequest — structured pickup / delivery request sales submits to operations when approving a quotation or purchase order. */
module.exports = (sequelize, DataTypes) => {
  const json = name => ({
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const raw = this.getDataValue(name);
      if (!raw) return [];
      try { return JSON.parse(raw); } catch (e) { return []; }
    },
    set(v) { this.setDataValue(name, v == null ? null : JSON.stringify(v)); },
  });
  const PickupRequest = sequelize.define(
    'PickupRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      source_type: { type: DataTypes.STRING(20), allowNull: false },
      source_id: { type: DataTypes.INTEGER, allowNull: false },
      request_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pickup' },
      company_name: { type: DataTypes.STRING(255), allowNull: true },
      contact_person: { type: DataTypes.STRING(255), allowNull: true },
      contact_phone: { type: DataTypes.STRING(100), allowNull: true },
      contact_email: { type: DataTypes.STRING(255), allowNull: true },
      request_date: { type: DataTypes.DATEONLY, allowNull: true },
      request_time: { type: DataTypes.STRING(20), allowNull: true },
      location_type: { type: DataTypes.STRING(20), allowNull: true },
      location_address: { type: DataTypes.STRING(500), allowNull: true },
      gate_pass_required: { type: DataTypes.BOOLEAN, allowNull: true },
      service_type: { type: DataTypes.STRING(30), allowNull: true },
      material_type: { type: DataTypes.STRING(500), allowNull: true },
      total_weight: { type: DataTypes.STRING(100), allowNull: true },
      truck_required: json('truck_required'),
      packing_type: { type: DataTypes.STRING(30), allowNull: true },
      labor_required: { type: DataTypes.BOOLEAN, allowNull: true },
      labor_count: { type: DataTypes.INTEGER, allowNull: true },
      wds_number: { type: DataTypes.STRING(100), allowNull: true },
      wds_food_type: { type: DataTypes.STRING(20), allowNull: true },
      dm_inspection_required: { type: DataTypes.BOOLEAN, allowNull: true },
      pickup_note_required: { type: DataTypes.BOOLEAN, allowNull: true },
      grn_required: { type: DataTypes.BOOLEAN, allowNull: true },
      certificates: json('certificates'),
      additional_notes: { type: DataTypes.TEXT, allowNull: true },
      requested_by: { type: DataTypes.STRING(255), allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'pickup_requests', timestamps: true, paranoid: false, underscored: true }
  );
  return PickupRequest;
};
