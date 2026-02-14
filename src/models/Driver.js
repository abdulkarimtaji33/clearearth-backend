/**
 * Driver Model
 */
module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    'Driver',
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
      employee_id: {
        type: DataTypes.INTEGER,
        references: { model: 'employees', key: 'id' },
      },
      license_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      license_type: {
        type: DataTypes.STRING(50),
      },
      license_expiry: {
        type: DataTypes.DATE,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'drivers',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['license_number'] },
      ],
    }
  );

  Driver.associate = models => {
    Driver.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Driver.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    Driver.hasMany(models.Trip, { foreignKey: 'driver_id', as: 'trips' });
  };

  return Driver;
};
