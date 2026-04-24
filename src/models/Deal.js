/**
 * Deal Model
 */

module.exports = (sequelize, DataTypes) => {
  const Deal = sequelize.define(
    'Deal',
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
      deal_number: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      lead_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'leads', key: 'id' },
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
      },
      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'contacts', key: 'id' },
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
      },
      downstream_partner_supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'suppliers', key: 'id' },
        comment: 'Second vendor for separate purchase quotation (downstream partner)',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      deal_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      vat_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5.00,
      },
      vat_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      total: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'AED',
      },
      status: {
        type: DataTypes.ENUM('new', 'approved', 'quotation_sent', 'negotiation', 'won', 'lost'),
        defaultValue: 'new',
      },
      loss_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for losing the deal (required when status = lost)',
      },
      payment_status: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        defaultValue: 'unpaid',
      },
      paid_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
      },
      terms_and_conditions_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'terms_and_conditions', key: 'id' },
      },
      deal_type: {
        type: DataTypes.ENUM('offer_to_charge', 'offer_to_purchase', 'free_of_charge'),
        allowNull: false,
        defaultValue: 'offer_to_purchase',
      },
      container_type: {
        type: DataTypes.ENUM('LCL', 'FCL'),
        allowNull: true,
      },
      location_type: {
        type: DataTypes.ENUM('Main Land', 'Free Zone'),
        allowNull: true,
      },
      wds_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inspection_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      custom_inspection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      trakhees_inspection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      dubai_municipality_inspection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_rcm_applicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Reverse Charge Mechanism: if true, VAT is paid to government by buyer and excluded from purchase documents',
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'deals',
      paranoid: true,
      indexes: [
        { fields: ['tenant_id'] },
        { fields: ['deal_number'], unique: true },
        { fields: ['lead_id'] },
        { fields: ['company_id'] },
        { fields: ['supplier_id'] },
        { fields: ['downstream_partner_supplier_id'] },
        { fields: ['status'] },
        { fields: ['payment_status'] },
        { fields: ['assigned_to'] },
      ],
    }
  );

  Deal.associate = models => {
    Deal.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
    Deal.belongsTo(models.Lead, { foreignKey: 'lead_id', as: 'lead' });
    Deal.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Deal.belongsTo(models.Contact, { foreignKey: 'contact_id', as: 'contact' });
    Deal.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Deal.belongsTo(models.Supplier, { foreignKey: 'downstream_partner_supplier_id', as: 'downstreamPartner' });
    Deal.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Deal.belongsTo(models.TermsAndConditions, { foreignKey: 'terms_and_conditions_id', as: 'termsAndConditions' });
    Deal.belongsToMany(models.TermsAndConditions, {
      through: models.DealTerm,
      foreignKey: 'deal_id',
      otherKey: 'terms_and_conditions_id',
      as: 'termsList',
    });
    Deal.hasMany(models.DealItem, { foreignKey: 'deal_id', as: 'items' });
    Deal.hasOne(models.DealWds, { foreignKey: 'deal_id', as: 'wdsDetails' });
    Deal.hasOne(models.DealInspectionRequest, { foreignKey: 'deal_id', as: 'inspectionRequest' });
    Deal.hasOne(models.DealInspectionReport, { foreignKey: 'deal_id', as: 'inspectionReport' });
    Deal.hasMany(models.DealImage, { foreignKey: 'deal_id', as: 'images' });
    Deal.hasMany(models.WorkOrder, { foreignKey: 'deal_id', as: 'workOrders' });
  };

  return Deal;
};
