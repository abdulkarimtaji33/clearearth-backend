/**
 * Profile Change Request Model
 */
module.exports = (sequelize, DataTypes) => {
  const ProfileChangeRequest = sequelize.define(
    'ProfileChangeRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
      field_group: { type: DataTypes.STRING(50), allowNull: true },
      // Custom getter: this project's DB is MariaDB, whose JSON type is a LONGTEXT alias,
      // so mysql2 doesn't auto-decode it and Sequelize's own JSON handling (which for the
      // mysql dialect relies on the driver having already parsed it) leaves it as a raw
      // string on reload. Parse defensively so callers always get a JS object back.
      changes: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
          const raw = this.getDataValue('changes');
          if (raw === null || raw === undefined || typeof raw === 'object') return raw;
          try {
            return JSON.parse(raw);
          } catch (e) {
            return raw;
          }
        },
      },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      reviewed_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      rejection_reason: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'profile_change_requests',
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }],
    }
  );

  ProfileChangeRequest.associate = models => {
    ProfileChangeRequest.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
    ProfileChangeRequest.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    ProfileChangeRequest.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewedByUser' });
  };

  return ProfileChangeRequest;
};
