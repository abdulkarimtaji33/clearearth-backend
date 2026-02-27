const express = require('express');
const router = express.Router();
const materialTypeController = require('../controllers/materialType.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, materialTypeController.getAll);

module.exports = router;
