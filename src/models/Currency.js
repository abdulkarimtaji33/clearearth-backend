/**
 * Currency Model
 */
module.exports = (sequelize, DataTypes) => {
  const Currency = sequelize.define(
    'Currency',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING(10),
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(15, 6),
        defaultValue: 1,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'currencies',
      indexes: [{ fields: ['code'], unique: true }],
    }
  );

  return Currency;
};
