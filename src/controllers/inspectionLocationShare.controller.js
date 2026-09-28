'use strict';

const crypto = require('crypto');
const { DealInspectionLocationToken, DealInspectionRequest, Deal } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

// POST /inspection-location-share/requests/:inspectionRequestId/token
// Authenticated — generates (or refreshes) a shareable token for an inspection request
const generateToken = asyncHandler(async (req, res) => {
  const { inspectionRequestId } = req.params;
  const tenantId = req.tenant?.id || req.user?.tenant_id;

  // DealInspectionRequest has no tenant_id column of its own — tenancy is
  // enforced through its parent Deal.
  const request = await DealInspectionRequest.findOne({
    where: { id: inspectionRequestId },
    include: [{ model: Deal, as: 'deal', attributes: ['id'], required: true, where: { tenant_id: tenantId } }],
  });
  if (!request) return res.status(404).json({ success: false, message: 'Inspection request not found' });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const existing = await DealInspectionLocationToken.findOne({
    where: { inspection_request_id: inspectionRequestId, tenant_id: tenantId, used_at: null },
  });

  let token;
  if (existing && existing.expires_at > new Date()) {
    token = existing.token;
    await existing.update({ expires_at: expiresAt });
  } else {
    await DealInspectionLocationToken.destroy({ where: { inspection_request_id: inspectionRequestId, tenant_id: tenantId } });
    token = crypto.randomBytes(32).toString('hex');
    await DealInspectionLocationToken.create({
      token,
      inspection_request_id: inspectionRequestId,
      tenant_id: tenantId,
      expires_at: expiresAt,
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const shareUrl = `${frontendUrl}/inspection-location-pin/${token}`;

  res.json({ success: true, shareUrl, expiresAt });
});

// GET /inspection-location-share/pin/:token
// Public — returns just enough inspection request info for the field contact to see context
const getTokenInfo = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const record = await DealInspectionLocationToken.findOne({
    where: { token },
    include: [
      {
        model: DealInspectionRequest,
        as: 'inspectionRequest',
        attributes: ['id', 'deal_id', 'location', 'material_type_id'],
        include: [{ model: Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'], required: false }],
      },
    ],
  });

  if (!record) return res.status(404).json({ success: false, message: 'Link not found' });
  if (new Date() > record.expires_at) return res.status(410).json({ success: false, message: 'This link has expired' });

  const ir = record.inspectionRequest;
  res.json({
    success: true,
    dealNumber: ir?.deal?.deal_number,
    dealTitle: ir?.deal?.title,
    currentLocation: ir?.location || null,
    usedAt: record.used_at,
    expiresAt: record.expires_at,
  });
});

// POST /inspection-location-share/pin/:token
// Public — field contact submits their chosen location
const submitLocation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { pickupLocation } = req.body;

  if (!pickupLocation || typeof pickupLocation !== 'string') {
    return res.status(400).json({ success: false, message: 'pickupLocation is required' });
  }

  const isMapsUrl = pickupLocation.startsWith('https://www.google.com/maps') ||
    pickupLocation.startsWith('https://maps.google.com') ||
    /^-?\d+\.\d+,-?\d+\.\d+$/.test(pickupLocation);

  if (!isMapsUrl) {
    return res.status(400).json({ success: false, message: 'Invalid location format' });
  }

  const record = await DealInspectionLocationToken.findOne({ where: { token } });
  if (!record) return res.status(404).json({ success: false, message: 'Link not found' });
  if (new Date() > record.expires_at) return res.status(410).json({ success: false, message: 'This link has expired' });

  await DealInspectionRequest.update(
    { location: pickupLocation, location_type: 'pin' },
    { where: { id: record.inspection_request_id } },
  );

  await record.update({ used_at: new Date() });

  res.json({ success: true, message: 'Location saved successfully' });
});

module.exports = { generateToken, getTokenInfo, submitLocation };
