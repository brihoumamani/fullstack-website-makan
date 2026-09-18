// makan-backend/controllers/leadController.js
const jwt = require('jsonwebtoken');
const Lead = require('../models/Lead');
const Property = require('../models/Property');

// @desc    Create new lead / property inquiry
// @route   POST /api/leads
// @access  Public (Optionally authenticated)
const createLead = async (req, res) => {
  try {
    const { name, email, phone, message, propertyId, recipientAgentId } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Try to identify logged-in user from cookie or authorization header
    let userId = null;
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'makan_secure_jwt_secret_dz_2026');
        if (decoded?.userId) {
          userId = decoded.userId;
        }
      } catch (err) {
        // Continue unauthenticated
      }
    }

    // Look up agent if property is provided and recipientAgentId is missing
    let targetAgentId = recipientAgentId || null;
    if (propertyId && !targetAgentId) {
      try {
        const prop = await Property.findById(propertyId);
        if (prop && prop.agentId) {
          targetAgentId = prop.agentId;
        }
      } catch (e) {
        // Ignore invalid property ID
      }
    }

    const lead = await Lead.create({
      userId,
      name,
      email,
      phone: phone || '',
      message,
      propertyId: propertyId || null,
      recipientAgentId: targetAgentId,
      status: 'Nouveau'
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: lead
    });
  } catch (error) {
    console.error(`Error creating lead: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createLead
};