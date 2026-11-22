/** OutboundEvent — audit trail for an outbound entry (who did what and when). */
module.exports = (sequelize, DataTypes) => {
  const OutboundEvent = sequelize.define(
    'OutboundEvent',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      outbound_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING(40), allowNull: false },
      detail: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'outbound_events', timestamps: true, updatedAt: false, paranoid: false, underscored: true }
  );
  OutboundEvent.associate = (models) => {
    OutboundEvent.belongsTo(models.Outbound, { foreignKey: 'outbound_id', as: 'outbound' });
    OutboundEvent.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };
  return OutboundEvent;
};
