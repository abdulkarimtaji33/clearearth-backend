/**
 * Main Routes Index
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const contactRoutes = require('./contact.routes');
const companyRoutes = require('./company.routes');
const supplierRoutes = require('./supplier.routes');
const leadRoutes = require('./lead.routes');
const productServiceRoutes = require('./productService.routes');
const dealRoutes = require('./deal.routes');
const dropdownRoutes = require('./dropdown.routes');
const materialTypeRoutes = require('./materialType.routes');
const uploadRoutes = require('./upload.routes');
const termsRoutes = require('./termsAndConditions.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'ClearEarth ERP API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      roles: '/roles',
      contacts: '/contacts',
      companies: '/companies',
      suppliers: '/suppliers',
      leads: '/leads',
      products: '/products',
      deals: '/deals',
      dropdowns: '/dropdowns',
      terms: '/terms',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/leads', leadRoutes);
router.use('/products', productServiceRoutes);
router.use('/deals', dealRoutes);
router.use('/dropdowns', dropdownRoutes);
router.use('/material-types', materialTypeRoutes);
router.use('/upload', uploadRoutes);
router.use('/terms', termsRoutes);

module.exports = router;
