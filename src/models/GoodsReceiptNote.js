/**
 * Goods Receipt Note Model
 */
const { GRN_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const GoodsReceiptNote = sequelize.define(
    'GoodsReceiptNote',
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
      grn_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' },
      },
      warehouse_id: {
        type: DataTypes.INTEGER,
        references: { model: 'warehouses', key: 'id' },
      },
      received_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      received_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        references: { model: 'vendors', key: 'id' },
      },
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: 'clients', key: 'id' },
      },
      material_type_id: {
        type: DataTypes.INTEGER,
        references: { model: 'material_types', key: 'id' },
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      unit_of_measure: {
        type: DataTypes.STRING(20),
      },
      weight_slip_number: {
        type: DataTypes.STRING(100),
      },
      photos: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(GRN_STATUS)),
        defaultValue: GRN_STATUS.DRAFT,
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
      tableName: 'goods_receipt_notes',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['grn_number'], unique: true },
        { fields: ['job_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['status'] },
      ],
    }
  );

  GoodsReceiptNote.associate = models => {
    GoodsReceiptNote.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    GoodsReceiptNote.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
    GoodsReceiptNote.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    GoodsReceiptNote.belongsTo(models.User, { foreignKey: 'received_by', as: 'receiver' });
    GoodsReceiptNote.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    GoodsReceiptNote.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    GoodsReceiptNote.belongsTo(models.MaterialType, { foreignKey: 'material_type_id', as: 'materialType' });
  };

  return GoodsReceiptNote;
};
