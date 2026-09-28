/**
 * CommissionSetting Model - per-user sales commission percentage, versioned by effective date
 */
module.exports = (sequelize, DataTypes) => {
  const CommissionSetting = sequelize.define(
    'CommissionSetting',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      commission_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      effective_from: { type: DataTypes.DATEONLY, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'commission_settings',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['user_id'] },
        { fields: ['is_active'] },
      ],
    }
  );

  CommissionSetting.associate = (models) => {
    CommissionSetting.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    CommissionSetting.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  };

  return CommissionSetting;
};
