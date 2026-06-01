'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { generateToken, getTokenInfo, submitLocation } = require('../controllers/locationShare.controller');

// Authenticated: generate a share link for a deal
router.post('/deals/:dealId/token', authenticate, generateToken);

// Public: client reads deal context from the token
router.get('/pin/:token', getTokenInfo);

// Public: client submits their chosen location
router.post('/pin/:token', submitLocation);

module.exports = router;
