/**
 * Asset Custody Model - Track company assets issued to employees
 */
module.exports = (sequelize, DataTypes) => {
  const AssetCustody = sequelize.define(
    'AssetCustody',
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
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      asset_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      asset_type: {
        type: DataTypes.STRING(100),
        comment: 'Laptop, Phone, Keys, Card, etc.',
      },
      asset_code: {
        type: DataTypes.STRING(50),
      },
      serial_number: {
        type: DataTypes.STRING(100),
      },
      description: {
        type: DataTypes.TEXT,
      },
      assigned_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      return_date: {
        type: DataTypes.DATE,
      },
      is_returned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      condition_at_issue: {
        type: DataTypes.TEXT,
      },
      condition_at_return: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'asset_custody',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['asset_code'] },
        { fields: ['is_returned'] },
      ],
    }
  );

  AssetCustody.associate = models => {
    AssetCustody.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    AssetCustody.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return AssetCustody;
};
