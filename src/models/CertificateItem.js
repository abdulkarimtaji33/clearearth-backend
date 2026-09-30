module.exports = (sequelize, DataTypes) => {
  const CertificateItem = sequelize.define(
    'CertificateItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_id: { type: DataTypes.INTEGER, allowNull: false },
      sl_no: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.STRING(255), allowNull: false },
      qty: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      unit: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'nos' },
      manufacturer: { type: DataTypes.STRING(100), allowNull: true },
      model_no: { type: DataTypes.STRING(100), allowNull: true },
      serial_no: { type: DataTypes.STRING(100), allowNull: true },
    },
    {
      tableName: 'certificate_items',
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  CertificateItem.associate = (models) => {
    CertificateItem.belongsTo(models.Certificate, { foreignKey: 'certificate_id', as: 'certificate' });
  };

  return CertificateItem;
};
