/**
 * Employee Model
 */
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      user_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      employee_code: { type: DataTypes.STRING(30), allowNull: false },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      department_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'departments', key: 'id' } },
      designation_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'designations', key: 'id' } },
      manager_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
      employment_type: { type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern'), allowNull: false, defaultValue: 'full_time' },
      date_of_joining: { type: DataTypes.DATEONLY, allowNull: false },
      date_of_exit: { type: DataTypes.DATEONLY, allowNull: true },
      employment_status: { type: DataTypes.ENUM('onboarding', 'active', 'on_leave', 'suspended', 'exited'), allowNull: false, defaultValue: 'onboarding' },
      gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      nationality: { type: DataTypes.STRING(60), allowNull: true },
      national_id: { type: DataTypes.STRING(60), allowNull: true },
      passport_number: { type: DataTypes.STRING(60), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      emergency_contact_name: { type: DataTypes.STRING(150), allowNull: true },
      emergency_contact_phone: { type: DataTypes.STRING(20), allowNull: true },
      bank_name: { type: DataTypes.STRING(100), allowNull: true },
      bank_account_number: { type: DataTypes.STRING(60), allowNull: true },
      bank_iban: { type: DataTypes.STRING(60), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      deleted_at: { type: DataTypes.DATE, allowNull: true },

      // -- Expanded profile fields (all nullable) --------------------------
      profile_photo: { type: DataTypes.STRING(500), allowNull: true },
      middle_name: { type: DataTypes.STRING(100), allowNull: true },
      preferred_name: { type: DataTypes.STRING(100), allowNull: true },
      legal_full_name: { type: DataTypes.STRING(255), allowNull: true },
      marital_status: { type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'), allowNull: true },
      religion: { type: DataTypes.STRING(50), allowNull: true },
      blood_group: { type: DataTypes.STRING(10), allowNull: true },
      personal_email: { type: DataTypes.STRING(150), allowNull: true },
      work_email: { type: DataTypes.STRING(150), allowNull: true },
      personal_phone: { type: DataTypes.STRING(20), allowNull: true },
      work_phone: { type: DataTypes.STRING(20), allowNull: true },
      current_address_line1: { type: DataTypes.STRING(255), allowNull: true },
      current_address_city: { type: DataTypes.STRING(100), allowNull: true },
      current_address_emirate: { type: DataTypes.STRING(100), allowNull: true },
      current_address_country: { type: DataTypes.STRING(100), allowNull: true },
      current_address_postal: { type: DataTypes.STRING(20), allowNull: true },
      permanent_address_line1: { type: DataTypes.STRING(255), allowNull: true },
      permanent_address_city: { type: DataTypes.STRING(100), allowNull: true },
      permanent_address_emirate: { type: DataTypes.STRING(100), allowNull: true },
      permanent_address_country: { type: DataTypes.STRING(100), allowNull: true },
      permanent_address_postal: { type: DataTypes.STRING(20), allowNull: true },
      work_location_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'work_locations', key: 'id' } },
      probation_start: { type: DataTypes.DATEONLY, allowNull: true },
      probation_end: { type: DataTypes.DATEONLY, allowNull: true },
      confirmation_date: { type: DataTypes.DATEONLY, allowNull: true },
      labour_card_no: { type: DataTypes.STRING(50), allowNull: true },
      mol_person_id: { type: DataTypes.STRING(50), allowNull: true },
      wps_person_code: { type: DataTypes.STRING(50), allowNull: true },
      tax_id: { type: DataTypes.STRING(50), allowNull: true },
      payment_method_detail: { type: DataTypes.STRING(50), allowNull: true },
      routing_code: { type: DataTypes.STRING(50), allowNull: true },
      salary_visible_to_employee: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    },
    {
      tableName: 'employees',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['department_id'] },
        { fields: ['manager_id'] },
        { fields: ['user_id'] },
        { fields: ['employment_status'] },
      ],
    }
  );

  Employee.associate = models => {
    Employee.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    Employee.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Employee.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
    Employee.belongsTo(models.Designation, { foreignKey: 'designation_id', as: 'designation' });
    Employee.belongsTo(models.Employee, { foreignKey: 'manager_id', as: 'manager' });
    Employee.hasMany(models.Employee, { foreignKey: 'manager_id', as: 'directReports' });
    Employee.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    Employee.belongsTo(models.WorkLocation, { foreignKey: 'work_location_id', as: 'workLocation' });
    Employee.hasMany(models.EmployeeSalaryStructure, { foreignKey: 'employee_id', as: 'salaryStructures' });
    Employee.hasMany(models.AttendanceRecord, { foreignKey: 'employee_id', as: 'attendanceRecords' });
    Employee.hasMany(models.LeaveBalance, { foreignKey: 'employee_id', as: 'leaveBalances' });
    Employee.hasMany(models.LeaveRequest, { foreignKey: 'employee_id', as: 'leaveRequests' });
    Employee.hasMany(models.Payslip, { foreignKey: 'employee_id', as: 'payslips' });
    Employee.hasMany(models.EmployeeEmergencyContact, { foreignKey: 'employee_id', as: 'emergencyContacts' });
    Employee.hasMany(models.EmployeeDependent, { foreignKey: 'employee_id', as: 'dependents' });
    Employee.hasMany(models.EmployeeQualification, { foreignKey: 'employee_id', as: 'qualifications' });
    Employee.hasMany(models.EmployeeSkill, { foreignKey: 'employee_id', as: 'skills' });
    Employee.hasMany(models.EmployeeCertification, { foreignKey: 'employee_id', as: 'certifications' });
    Employee.hasMany(models.EmployeePreviousEmployment, { foreignKey: 'employee_id', as: 'previousEmployment' });
    Employee.hasMany(models.EmployeeDocument, { foreignKey: 'employee_id', as: 'documents' });
    Employee.hasMany(models.EmployeeNote, { foreignKey: 'employee_id', as: 'employeeNotes' });
    Employee.hasMany(models.EmployeeHistory, { foreignKey: 'employee_id', as: 'history' });
    Employee.hasMany(models.ProfileChangeRequest, { foreignKey: 'employee_id', as: 'changeRequests' });
    Employee.hasMany(models.EmployeeAsset, { foreignKey: 'employee_id', as: 'assets' });
  };

  return Employee;
};
