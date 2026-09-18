// makan-backend/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  getPropertiesInRadius,
  createProperty
} = require('../controllers/propertyController');

// Radius geospatial route (MUST be placed before /:id so it does not get treated as an ID)
router.route('/radius').get(getPropertiesInRadius);

// Root route (All properties + query filters + creation)
router.route('/')
  .get(getProperties)
  .post(createProperty);

// Single property route
router.route('/:id').get(getPropertyById);

module.exports = router;