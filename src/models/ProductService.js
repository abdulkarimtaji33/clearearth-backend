/**
 * ProductService Model
 */

module.exports = (sequelize, DataTypes) => {
  const ProductService = sequelize.define(
    'ProductService',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('product', 'service'),
        allowNull: false,
        defaultValue: 'product',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Product or Service category',
      },
      description: {
        type: DataTypes.TEXT,
      },
      unit_of_measure: {
        type: DataTypes.STRING(50),
        comment: 'kg, ton, piece, hour, etc.',
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'products_services',
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['category'] },
        { fields: ['status'] },
        { fields: ['name'] },
      ],
    }
  );

  ProductService.associate = models => {
    ProductService.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    ProductService.hasMany(models.Lead, { foreignKey: 'product_service_id', as: 'leads' });
  };

  return ProductService;
};
