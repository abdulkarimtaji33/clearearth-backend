/**
 * Department Model
 */
module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      name: { type: DataTypes.STRING(100), allowNull: false },
      code: { type: DataTypes.STRING(20), allowNull: true },
      parent_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'departments', key: 'id' } },
      head_employee_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    },
    {
      tableName: 'departments',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['parent_id'] }],
    }
  );

  Department.associate = models => {
    Department.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Department.belongsTo(models.Department, { foreignKey: 'parent_id', as: 'parent' });
    Department.hasMany(models.Department, { foreignKey: 'parent_id', as: 'children' });
    Department.belongsTo(models.Employee, { foreignKey: 'head_employee_id', as: 'headEmployee' });
    Department.hasMany(models.Employee, { foreignKey: 'department_id', as: 'employees' });
    Department.hasMany(models.Designation, { foreignKey: 'department_id', as: 'designations' });
  };

  return Department;
};
