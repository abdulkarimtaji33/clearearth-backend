/**
 * Dropdown Controller
 */
const {
  Designation,
  IndustryType,
  UaeCity,
  Country,
  LeadSource,
  ContactRole,
  ServiceInterest,
  ProductCategory,
  UnitOfMeasure,
  DealStatus,
  PaymentStatus,
  Status,
  QuotationStatus,
  PurchaseOrderStatus,
} = require('../models');

// Model mapping for all dropdown categories
const modelMap = {
  'designations': Designation,
  'industry_types': IndustryType,
  'uae_cities': UaeCity,
  'countries': Country,
  'lead_sources': LeadSource,
  'contact_roles': ContactRole,
  'service_interests': ServiceInterest,
  'product_categories': ProductCategory,
  'units_of_measure': UnitOfMeasure,
  'deal_status': DealStatus,
  'payment_status': PaymentStatus,
  'status': Status,
};

/**
 * Get dropdown values by category
 */
exports.getDropdownsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const Model = modelMap[category];
    
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    const dropdowns = await Model.findAll({
      where: { is_active: true },
      order: [
        ['display_order', 'ASC'],
        ['display_name', 'ASC'],
      ],
      attributes: ['id', 'value', 'display_name', 'display_order'],
    });

    res.json({
      success: true,
      data: dropdowns,
    });
  } catch (error) {
    console.error('Error fetching dropdowns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropdown values',
      errors: error.message,
    });
  }
};

/**
 * Get all dropdown categories with their values
 */
exports.getAllDropdowns = async (req, res) => {
  try {
    const whereClause = { is_active: true };
    const orderClause = [['display_order', 'ASC'], ['display_name', 'ASC']];
    const attributes = ['id', 'value', 'display_name', 'display_order'];

    // Fetch from all separate tables in parallel
    const [
      designations,
      industryTypes,
      uaeCities,
      countries,
      leadSources,
      contactRoles,
      serviceInterests,
      productCategories,
      unitsOfMeasure,
      dealStatuses,
      paymentStatuses,
      statuses,
      quotationStatuses,
      purchaseOrderStatuses,
    ] = await Promise.all([
      Designation.findAll({ where: whereClause, order: orderClause, attributes }),
      IndustryType.findAll({ where: whereClause, order: orderClause, attributes }),
      UaeCity.findAll({ where: whereClause, order: orderClause, attributes }),
      Country.findAll({ where: whereClause, order: orderClause, attributes }),
      LeadSource.findAll({ where: whereClause, order: orderClause, attributes }),
      ContactRole.findAll({ where: whereClause, order: orderClause, attributes }),
      ServiceInterest.findAll({ where: whereClause, order: orderClause, attributes }),
      ProductCategory.findAll({ where: whereClause, order: orderClause, attributes }),
      UnitOfMeasure.findAll({ where: whereClause, order: orderClause, attributes }),
      DealStatus.findAll({ where: whereClause, order: orderClause, attributes }),
      PaymentStatus.findAll({ where: whereClause, order: orderClause, attributes }),
      Status.findAll({ where: whereClause, order: orderClause, attributes }),
      QuotationStatus.findAll({ where: whereClause, order: orderClause, attributes }),
      PurchaseOrderStatus.findAll({ where: whereClause, order: orderClause, attributes }),
    ]);

    res.json({
      success: true,
      data: {
        designations: designations.map(d => d.toJSON()),
        industry_types: industryTypes.map(d => d.toJSON()),
        uae_cities: uaeCities.map(d => d.toJSON()),
        countries: countries.map(d => d.toJSON()),
        lead_sources: leadSources.map(d => d.toJSON()),
        contact_roles: contactRoles.map(d => d.toJSON()),
        service_interests: serviceInterests.map(d => d.toJSON()),
        product_categories: productCategories.map(d => d.toJSON()),
        units_of_measure: unitsOfMeasure.map(d => d.toJSON()),
        deal_status: dealStatuses.map(d => d.toJSON()),
        payment_status: paymentStatuses.map(d => d.toJSON()),
        status: statuses.map(d => d.toJSON()),
        quotation_status: quotationStatuses.map(d => d.toJSON()),
        purchase_order_status: purchaseOrderStatuses.map(d => d.toJSON()),
      },
    });
  } catch (error) {
    console.error('Error fetching all dropdowns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropdown values',
      errors: error.message,
    });
  }
};

/**
 * Create a new dropdown value (admin only)
 */
exports.createDropdown = async (req, res) => {
  try {
    const { category, value, display_name, display_order, is_active } = req.body;

    const Model = modelMap[category];
    
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    const dropdown = await Model.create({
      value,
      display_name,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      success: true,
      message: 'Dropdown value created successfully',
      data: dropdown,
    });
  } catch (error) {
    console.error('Error creating dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dropdown value',
      errors: error.message,
    });
  }
};

/**
 * Update dropdown value
 */
exports.updateDropdown = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, value, display_name, display_order, is_active } = req.body;

    const Model = modelMap[category];
    
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    const dropdown = await Model.findByPk(id);

    if (!dropdown) {
      return res.status(404).json({
        success: false,
        message: 'Dropdown value not found',
      });
    }

    await dropdown.update({
      value: value || dropdown.value,
      display_name: display_name || dropdown.display_name,
      display_order: display_order !== undefined ? display_order : dropdown.display_order,
      is_active: is_active !== undefined ? is_active : dropdown.is_active,
    });

    res.json({
      success: true,
      message: 'Dropdown value updated successfully',
      data: dropdown,
    });
  } catch (error) {
    console.error('Error updating dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dropdown value',
      errors: error.message,
    });
  }
};

/**
 * Delete dropdown value
 */
exports.deleteDropdown = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const Model = modelMap[category];
    
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    const dropdown = await Model.findByPk(id);

    if (!dropdown) {
      return res.status(404).json({
        success: false,
        message: 'Dropdown value not found',
      });
    }

    await dropdown.destroy();

    res.json({
      success: true,
      message: 'Dropdown value deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dropdown value',
      errors: error.message,
    });
  }
};
