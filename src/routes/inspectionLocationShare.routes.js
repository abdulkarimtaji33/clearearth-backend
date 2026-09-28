'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { generateToken, getTokenInfo, submitLocation } = require('../controllers/inspectionLocationShare.controller');

// Authenticated: generate a share link for an inspection request
router.post('/requests/:inspectionRequestId/token', authenticate, authorize('inspection_requests.update'), generateToken);

// Public: field contact reads inspection request context from the token
router.get('/pin/:token', getTokenInfo);

// Public: field contact submits their chosen location
router.post('/pin/:token', submitLocation);

module.exports = router;
