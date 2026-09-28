/**
 * Holiday Model
 */
module.exports = (sequelize, DataTypes) => {
  const Holiday = sequelize.define(
    'Holiday',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      name: { type: DataTypes.STRING(100), allowNull: false },
      holiday_date: { type: DataTypes.DATEONLY, allowNull: false },
      is_recurring: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'holidays',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'holiday_date'], unique: true }],
    }
  );

  Holiday.associate = models => {
    Holiday.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
  };

  return Holiday;
};
