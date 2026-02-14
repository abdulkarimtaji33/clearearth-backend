const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/overview', authorize('dashboard.read'), dashboardController.getOverviewKPIs);
router.get('/sales-trends', authorize('dashboard.read'), dashboardController.getSalesTrends);
router.get('/material-breakdown', authorize('dashboard.read'), dashboardController.getMaterialTypeBreakdown);
router.get('/top-clients', authorize('dashboard.read'), dashboardController.getTopClients);
router.get('/recent-activities', authorize('dashboard.read'), dashboardController.getRecentActivities);

module.exports = router;
