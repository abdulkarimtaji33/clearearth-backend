/**
 * DealTerm - Junction model for Deal <-> TermsAndConditions (many-to-many)
 */
module.exports = (sequelize, DataTypes) => {
  const DealTerm = sequelize.define(
    'DealTerm',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
        onDelete: 'CASCADE',
      },
      terms_and_conditions_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'terms_and_conditions', key: 'id' },
        onDelete: 'CASCADE',
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'deal_terms',
      timestamps: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['deal_id'] },
        { fields: ['terms_and_conditions_id'] },
        { unique: true, fields: ['deal_id', 'terms_and_conditions_id'] },
      ],
    }
  );

  DealTerm.associate = (models) => {
    DealTerm.belongsTo(models.Deal, { foreignKey: 'deal_id' });
    DealTerm.belongsTo(models.TermsAndConditions, { foreignKey: 'terms_and_conditions_id' });
  };

  return DealTerm;
};
