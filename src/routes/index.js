/**
 * Main Routes Index
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const clientRoutes = require('./client.routes');
const vendorRoutes = require('./vendor.routes');
const contactRoutes = require('./contact.routes');
const companyRoutes = require('./company.routes');
const supplierRoutes = require('./supplier.routes');
const leadRoutes = require('./lead.routes');
const dealRoutes = require('./deal.routes');
const productRoutes = require('./product.routes');
const serviceRoutes = require('./service.routes');
const warehouseRoutes = require('./warehouse.routes');
const inventoryRoutes = require('./inventory.routes');
const jobRoutes = require('./job.routes');
const invoiceRoutes = require('./invoice.routes');
const paymentRoutes = require('./payment.routes');
const employeeRoutes = require('./employee.routes');
const vehicleRoutes = require('./vehicle.routes');
const documentRoutes = require('./document.routes');
const certificateRoutes = require('./certificate.routes');
const commissionRoutes = require('./commission.routes');
const inboundRoutes = require('./inbound.routes');
const outboundRoutes = require('./outbound.routes');
const accountingRoutes = require('./accounting.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const settingsRoutes = require('./settings.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'ClearEarth ERP API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      roles: '/roles',
      clients: '/clients',
      vendors: '/vendors',
      contacts: '/contacts',
      companies: '/companies',
      suppliers: '/suppliers',
      leads: '/leads',
      deals: '/deals',
      products: '/products',
      services: '/services',
      warehouses: '/warehouses',
      inventory: '/inventory',
      jobs: '/jobs',
      invoices: '/invoices',
      payments: '/payments',
      employees: '/employees',
      vehicles: '/vehicles',
      documents: '/documents',
      certificates: '/certificates',
      commissions: '/commissions',
      inbound: '/inbound',
      outbound: '/outbound',
      accounting: '/accounting',
      dashboard: '/dashboard',
      reports: '/reports',
      settings: '/settings',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/clients', clientRoutes);
router.use('/vendors', vendorRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/leads', leadRoutes);
router.use('/deals', dealRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/jobs', jobRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/employees', employeeRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/documents', documentRoutes);
router.use('/certificates', certificateRoutes);
router.use('/commissions', commissionRoutes);
router.use('/inbound', inboundRoutes);
router.use('/outbound', outboundRoutes);
router.use('/accounting', accountingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
