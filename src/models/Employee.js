/**
 * Employee Model
 */
const { EMPLOYEE_STATUS } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    'Employee',
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
      employee_code: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      date_of_birth: {
        type: DataTypes.DATE,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
      },
      nationality: {
        type: DataTypes.STRING(100),
      },
      passport_number: {
        type: DataTypes.STRING(50),
      },
      passport_expiry: {
        type: DataTypes.DATE,
      },
      emirates_id: {
        type: DataTypes.STRING(50),
      },
      emirates_id_expiry: {
        type: DataTypes.DATE,
      },
      visa_number: {
        type: DataTypes.STRING(50),
      },
      visa_expiry: {
        type: DataTypes.DATE,
      },
      department: {
        type: DataTypes.STRING(100),
      },
      designation: {
        type: DataTypes.STRING(100),
      },
      joining_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      leaving_date: {
        type: DataTypes.DATE,
      },
      basic_salary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      housing_allowance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      transport_allowance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      other_allowances: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      bank_name: {
        type: DataTypes.STRING(100),
      },
      bank_account_number: {
        type: DataTypes.STRING(50),
      },
      bank_iban: {
        type: DataTypes.STRING(50),
      },
      emergency_contact_name: {
        type: DataTypes.STRING(100),
      },
      emergency_contact_phone: {
        type: DataTypes.STRING(20),
      },
      photo: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM(...Object.values(EMPLOYEE_STATUS)),
        defaultValue: EMPLOYEE_STATUS.ACTIVE,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'employees',
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['employee_code'], unique: true },
        { fields: ['email'] },
        { fields: ['status'] },
        { fields: ['department'] },
      ],
    }
  );

  Employee.associate = models => {
    Employee.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Employee.hasOne(models.User, { foreignKey: 'employee_id', as: 'user' });
    Employee.hasOne(models.Driver, { foreignKey: 'employee_id', as: 'driver' });
    Employee.hasMany(models.Leave, { foreignKey: 'employee_id', as: 'leaves' });
    Employee.hasMany(models.Attendance, { foreignKey: 'employee_id', as: 'attendances' });
    Employee.hasMany(models.Payroll, { foreignKey: 'employee_id', as: 'payrolls' });
    Employee.hasMany(models.Commission, { foreignKey: 'employee_id', as: 'commissions' });
    Employee.hasMany(models.AssetCustody, { foreignKey: 'employee_id', as: 'assets' });
  };

  return Employee;
};
