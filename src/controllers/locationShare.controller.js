'use strict';

const crypto = require('crypto');
const { DealLocationToken, Deal } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

// POST /location-share/deals/:dealId/token
// Authenticated — generates (or refreshes) a shareable token for a deal
const generateToken = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const tenantId = req.tenant?.id || req.user?.tenant_id;

  const deal = await Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

  // Expire any existing active tokens for this deal
  await DealLocationToken.destroy({ where: { deal_id: dealId, tenant_id: tenantId } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await DealLocationToken.create({
    token,
    deal_id: dealId,
    tenant_id: tenantId,
    expires_at: expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const shareUrl = `${frontendUrl}/location-pin/${token}`;

  res.json({ success: true, shareUrl, expiresAt });
});

// GET /location-share/pin/:token
// Public — returns just enough deal info for the client to see context
const getTokenInfo = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const record = await DealLocationToken.findOne({
    where: { token },
    include: [{ model: Deal, as: 'deal', attributes: ['id', 'deal_number', 'pickup_contact_name', 'pickup_location'] }],
  });

  if (!record) return res.status(404).json({ success: false, message: 'Link not found or expired' });
  if (new Date() > record.expires_at) return res.status(410).json({ success: false, message: 'This link has expired' });

  res.json({
    success: true,
    dealNumber: record.deal?.deal_number,
    contactName: record.deal?.pickup_contact_name,
    currentLocation: record.deal?.pickup_location || null,
    usedAt: record.used_at,
    expiresAt: record.expires_at,
  });
});

// POST /location-share/pin/:token
// Public — client submits their chosen location
const submitLocation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { pickupLocation } = req.body;

  if (!pickupLocation || typeof pickupLocation !== 'string') {
    return res.status(400).json({ success: false, message: 'pickupLocation is required' });
  }

  // Basic sanity check — must look like a maps URL or coords
  const isMapsUrl = pickupLocation.startsWith('https://www.google.com/maps') ||
    pickupLocation.startsWith('https://maps.google.com') ||
    /^-?\d+\.\d+,-?\d+\.\d+$/.test(pickupLocation);

  if (!isMapsUrl) {
    return res.status(400).json({ success: false, message: 'Invalid location format' });
  }

  const record = await DealLocationToken.findOne({ where: { token } });
  if (!record) return res.status(404).json({ success: false, message: 'Link not found' });
  if (new Date() > record.expires_at) return res.status(410).json({ success: false, message: 'This link has expired' });

  await Deal.update(
    { pickup_location: pickupLocation },
    { where: { id: record.deal_id, tenant_id: record.tenant_id } },
  );

  await record.update({ used_at: new Date() });

  res.json({ success: true, message: 'Location saved successfully' });
});

module.exports = { generateToken, getTokenInfo, submitLocation };
