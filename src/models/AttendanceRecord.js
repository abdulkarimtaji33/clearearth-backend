/**
 * Attendance Record Model
 */
module.exports = (sequelize, DataTypes) => {
  const AttendanceRecord = sequelize.define(
    'AttendanceRecord',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
      check_in_time: { type: DataTypes.DATE, allowNull: true },
      check_out_time: { type: DataTypes.DATE, allowNull: true },
      check_in_source: { type: DataTypes.ENUM('self', 'hr_manual'), allowNull: false, defaultValue: 'self' },
      check_out_source: { type: DataTypes.ENUM('self', 'hr_manual'), allowNull: false, defaultValue: 'self' },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'),
        allowNull: false,
        defaultValue: 'present',
      },
      work_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      notes: { type: DataTypes.STRING(255), allowNull: true },
      entered_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      check_in_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      check_in_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      check_out_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      check_out_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      check_in_ip: { type: DataTypes.STRING(45), allowNull: true },
      check_out_ip: { type: DataTypes.STRING(45), allowNull: true },
    },
    {
      tableName: 'attendance_records',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_id'] },
        { fields: ['attendance_date'] },
        { fields: ['tenant_id', 'employee_id', 'attendance_date'], unique: true },
      ],
    }
  );

  AttendanceRecord.associate = models => {
    AttendanceRecord.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    AttendanceRecord.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    AttendanceRecord.belongsTo(models.User, { foreignKey: 'entered_by', as: 'enteredByUser' });
  };

  return AttendanceRecord;
};
