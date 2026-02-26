/**
 * DealWds Model - Waste Disposal Service details for deals
 */

module.exports = (sequelize, DataTypes) => {
  const DealWds = sequelize.define(
    'DealWds',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ref_no: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      license_no: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      waste_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      source_process: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      package_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      quantity_per_package: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      total_weight: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      container_no: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bl_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bor_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'deal_wds',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['deal_id'] },
        { fields: ['ref_no'] },
      ],
    }
  );

  DealWds.associate = models => {
    DealWds.belongsTo(models.Deal, { foreignKey: 'deal_id', as: 'deal' });
  };

  return DealWds;
};
