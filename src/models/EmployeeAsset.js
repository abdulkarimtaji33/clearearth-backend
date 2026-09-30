/**
 * Employee Asset Model (IT asset tracking / custody)
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeAsset = sequelize.define(
    'EmployeeAsset',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      asset_type: { type: DataTypes.STRING(100), allowNull: true },
      asset_name: { type: DataTypes.STRING(150), allowNull: true },
      serial_number: { type: DataTypes.STRING(100), allowNull: true },
      assigned_date: { type: DataTypes.DATEONLY, allowNull: true },
      condition_notes: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM('assigned', 'returned'), allowNull: false, defaultValue: 'assigned' },
      returned_date: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      tableName: 'employee_assets',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }],
    }
  );

  EmployeeAsset.associate = models => {
    EmployeeAsset.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeAsset.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeAsset;
};
