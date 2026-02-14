/**
 * Attendance Model
 */
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    'Attendance',
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
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      attendance_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      check_in_time: {
        type: DataTypes.DATE,
      },
      check_out_time: {
        type: DataTypes.DATE,
      },
      working_hours: {
        type: DataTypes.DECIMAL(5, 2),
      },
      overtime_hours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave', 'holiday'),
        defaultValue: 'present',
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'attendances',
      updatedAt: false,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['attendance_date'] },
        { fields: ['employee_id', 'attendance_date'], unique: true },
      ],
    }
  );

  Attendance.associate = models => {
    Attendance.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Attendance.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
  };

  return Attendance;
};
