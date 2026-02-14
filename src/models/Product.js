/**
 * Product Model
 */
const { RECORD_STATUS, UNIT_OF_MEASURE } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
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
      product_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.STRING(100),
      },
      unit_of_measure: {
        type: DataTypes.ENUM(...Object.values(UNIT_OF_MEASURE)),
        defaultValue: UNIT_OF_MEASURE.KG,
      },
      purchase_price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      selling_price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5,
      },
      hs_code: {
        type: DataTypes.STRING(20),
        comment: 'Harmonized System Code for customs',
      },
      image: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RECORD_STATUS)),
        defaultValue: RECORD_STATUS.PENDING,
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'products',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['product_code'], unique: true },
        { fields: ['status'] },
        { fields: ['category'] },
      ],
    }
  );

  Product.associate = models => {
    Product.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  };

  return Product;
};
