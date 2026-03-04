/**
 * PurchaseOrderTerm - Junction model for PurchaseOrder <-> TermsAndConditions (many-to-many)
 */
module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderTerm = sequelize.define(
    'PurchaseOrderTerm',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'purchase_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      terms_and_conditions_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'terms_and_conditions', key: 'id' },
        onDelete: 'CASCADE',
      },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'purchase_order_terms',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['purchase_order_id'] },
        { fields: ['terms_and_conditions_id'] },
        { unique: true, fields: ['purchase_order_id', 'terms_and_conditions_id'] },
      ],
    }
  );

  PurchaseOrderTerm.associate = (models) => {
    PurchaseOrderTerm.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id' });
    PurchaseOrderTerm.belongsTo(models.TermsAndConditions, { foreignKey: 'terms_and_conditions_id' });
  };

  return PurchaseOrderTerm;
};
