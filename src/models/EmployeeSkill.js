/**
 * Employee Skill Model
 */
module.exports = (sequelize, DataTypes) => {
  const EmployeeSkill = sequelize.define(
    'EmployeeSkill',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      skill_name: { type: DataTypes.STRING(100), allowNull: true },
      proficiency_level: { type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'), allowNull: true },
    },
    {
      tableName: 'employee_skills',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }],
    }
  );

  EmployeeSkill.associate = models => {
    EmployeeSkill.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    EmployeeSkill.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return EmployeeSkill;
};
