/**
 * Warehouse Model
 */
module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    'Warehouse',
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('warehouse', 'yard', 'processing_facility'),
        defaultValue: 'warehouse',
      },
      address: {
        type: DataTypes.TEXT,
      },
      city: {
        type: DataTypes.STRING(100),
      },
      contact_person: {
        type: DataTypes.STRING(100),
      },
      contact_phone: {
        type: DataTypes.STRING(20),
      },
      capacity: {
        type: DataTypes.DECIMAL(15, 2),
        comment: 'Capacity in tons',
      },
      manager_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'warehouses',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['code'], unique: true },
        { fields: ['is_active'] },
      ],
    }
  );

  Warehouse.associate = models => {
    Warehouse.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Warehouse.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    Warehouse.hasMany(models.Inventory, { foreignKey: 'warehouse_id', as: 'inventory' });
  };

  return Warehouse;
};
