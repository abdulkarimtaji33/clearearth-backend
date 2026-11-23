/** PickupNoteDetail / PickupNoteItem — the paper pick-up note (header, customer details, item lines) for one pickup task. */
module.exports = (sequelize, DataTypes) => {
  const PickupNoteDetail = sequelize.define(
    'PickupNoteDetail',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      task_id: { type: DataTypes.INTEGER, allowNull: false },
      note_number: { type: DataTypes.STRING(50), allowNull: true },
      pickup_date: { type: DataTypes.DATEONLY, allowNull: true },
      vehicle_no: { type: DataTypes.STRING(50), allowNull: true },
      reference_no: { type: DataTypes.STRING(100), allowNull: true },
      pickup_type: { type: DataTypes.STRING(20), allowNull: true },
      service_type: { type: DataTypes.STRING(100), allowNull: true },
      service_offered: { type: DataTypes.STRING(1000), allowNull: true },
      customer_name: { type: DataTypes.STRING(255), allowNull: true },
      customer_address: { type: DataTypes.STRING(500), allowNull: true },
      contact_person: { type: DataTypes.STRING(255), allowNull: true },
      contact_no: { type: DataTypes.STRING(100), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      special_request: { type: DataTypes.TEXT, allowNull: true },
      free_note: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'pickup_note_details', timestamps: true, paranoid: false, underscored: true }
  );
  return PickupNoteDetail;
};
