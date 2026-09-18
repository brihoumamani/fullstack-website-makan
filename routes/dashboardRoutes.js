// makan-backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  toggleDashboardMode,
  completeAdvertiserOnboarding,
  getFavorites,
  toggleFavorite,
  getMyListings,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
  getClientRequests,
  getVisits,
  updateProfile,
  getMyMessages,
  sendClientMessage,
  replyToRequest
} = require('../controllers/dashboardController');

// All dashboard routes are protected
router.use(protect);

// Stats & Mode Switching
router.get('/stats', getDashboardStats);
router.post('/toggle-mode', toggleDashboardMode);
router.post('/onboarding', completeAdvertiserOnboarding);

// Favorites Management
router.get('/favorites', getFavorites);
router.post('/favorites/:id', toggleFavorite);

// Advertiser Listings
router.get('/listings', getMyListings);
router.post('/properties', createProperty);
router.put('/properties/:id', updateProperty);
router.patch('/properties/:id/status', updatePropertyStatus);
router.delete('/properties/:id', deleteProperty);

// Leads, Inquiries & Visits
router.get('/requests', getClientRequests);
router.post('/requests/:id/reply', replyToRequest);
router.get('/visits', getVisits);
router.get('/my-messages', getMyMessages);
router.post('/my-messages', sendClientMessage);

// Profile & Settings
router.put('/profile', updateProfile);

module.exports = router;

