const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/overview', dashboardController.overview);

module.exports = router;
