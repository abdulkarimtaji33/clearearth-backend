/**
 * DealWdsAttachment Model - Attachments for WDS (Waste Disposal Service) details in deals
 */

module.exports = (sequelize, DataTypes) => {
  const DealWdsAttachment = sequelize.define(
    'DealWdsAttachment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_wds_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'deal_wds_attachments',
      timestamps: true,
      underscored: true,
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['deal_wds_id'] }],
    }
  );

  DealWdsAttachment.associate = models => {
    DealWdsAttachment.belongsTo(models.DealWds, { foreignKey: 'deal_wds_id', as: 'dealWds' });
  };

  return DealWdsAttachment;
};
