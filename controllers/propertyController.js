// makan-backend/controllers/propertyController.js
const Property = require('../models/Property');

// @desc    Get all properties (with advanced filtering)
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { rentOrSale, type, minPrice, maxPrice, beds, baths, location, search, city, wilaya, commune } = req.query;

    let query = {};

    if (rentOrSale && rentOrSale !== 'all') query.rentOrSale = rentOrSale;
    if (type && type !== 'all') query.type = type;
    if (wilaya && wilaya !== 'all') query.wilaya = new RegExp(wilaya.trim(), 'i');
    if (commune && commune !== 'all') query.commune = new RegExp(commune.trim(), 'i');
    if (beds && beds !== 'all') query.beds = { $gte: Number(beds) };
    if (baths && baths !== 'all') query.baths = { $gte: Number(baths) };

    const locQuery = location || search || city;
    if (locQuery && locQuery.trim() !== '' && locQuery.toLowerCase() !== 'all') {
      const regex = new RegExp(locQuery.trim(), 'i');
      query.$or = [
        { wilaya: regex },
        { commune: regex },
        { city: regex },
        { address: regex },
        { state: regex },
        { title: regex },
        { description: regex }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const properties = await Property.find(query).populate('agentId', 'name email phone');
    
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error(`Error fetching properties: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('agentId', 'name email phone bio photo');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    // If the ID format is invalid for MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    console.error(`Error fetching property: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get properties within a radius (in kilometers)
// @route   GET /api/properties/radius?lng=...&lat=...&distance=...
// @access  Public
const getPropertiesInRadius = async (req, res) => {
  try {
    const { lng, lat, distance } = req.query;

    if (!lng || !lat || !distance) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lng, lat, and distance (in km)'
      });
    }

    // Earth Radius in kilometers is approx 6,378.1 km
    const earthRadiusInKm = 6378.1;
    const radiusInRadians = Number(distance) / earthRadiusInKm;

    const properties = await Property.find({
      location: {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      }
    }).populate('agentId', 'name email phone');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error(`Error in geospatial query: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');

// @desc    Create a new property (Public /advertise wizard or Authenticated)
// @route   POST /api/properties
// @access  Public (Optionally authenticated)
const createProperty = async (req, res) => {
  try {
    // Check if user is authenticated via cookie or Authorization header
    let user = null;
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'makan_secure_jwt_secret_dz_2026'
        );
        user = await User.findById(decoded.userId);
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }

    const {
      title,
      description,
      price,
      currency,
      rentOrSale,
      listingType,
      type,
      category,
      address,
      neighborhood,
      commune,
      district,
      wilaya,
      city,
      zip,
      beds,
      rooms,
      baths,
      sqm,
      grossM2,
      netM2,
      features,
      images,
      coordinates,
      contactData,
      phone
    } = req.body;

    // Normalization of offer type (rentOrSale)
    const rawRentOrSale = (rentOrSale || listingType || 'sale').toString().toLowerCase();
    let normalizedRentOrSale = 'sale';
    if (rawRentOrSale.includes('daily') || rawRentOrSale.includes('jour')) {
      normalizedRentOrSale = 'daily_rental';
    } else if (rawRentOrSale.includes('rent') || rawRentOrSale.includes('location')) {
      normalizedRentOrSale = 'rent';
    } else {
      normalizedRentOrSale = 'sale';
    }

    // Normalization of property type/category
    const rawType = (type || category || 'apartment').toString().toLowerCase();
    let normalizedType = 'apartment';
    if (rawType.includes('villa')) normalizedType = 'villa';
    else if (rawType.includes('house') || rawType.includes('maison')) normalizedType = 'house';
    else if (rawType.includes('commercial') || rawType.includes('bureau') || rawType.includes('local')) normalizedType = 'commercial';
    else if (rawType.includes('land') || rawType.includes('terrain')) normalizedType = 'land';
    else normalizedType = 'apartment';

    // Parse rooms/beds (e.g. "4 + 1" -> 4, or 3 -> 3)
    let parsedBeds = 3;
    if (beds !== undefined && !isNaN(beds)) {
      parsedBeds = Number(beds);
    } else if (rooms && typeof rooms === 'string') {
      const match = rooms.match(/\d+/);
      if (match) parsedBeds = parseInt(match[0], 10);
    }

    const effectiveWilaya = wilaya || city || 'Alger';
    const effectiveCommune = commune || district || 'Hydra';
    const effectiveAddress = address || neighborhood || `${effectiveCommune}, ${effectiveWilaya}`;
    const effectivePrice = Number(String(price).replace(/[.,\s]/g, '')) || 25000000;
    const effectiveSqm = Number(sqm || grossM2 || netM2) || 120;
    const effectivePhone = contactData?.mobile1 || phone || user?.phone || '0799999999';

    // Agent resolution & linking
    let agent = null;
    if (user) {
      agent = await Agent.findOne({ email: user.email });
      if (!agent) {
        agent = await Agent.create({
          name: user.name,
          company: user.advertiserProfile?.agencyName || user.companyName || 'Particulier / Annonceur',
          email: user.email,
          phone: effectivePhone,
          address: `${effectiveCommune}, ${effectiveWilaya}, Algérie`,
          avatar: user.avatar
        });
      }
    } else {
      agent = await Agent.findOne({ phone: effectivePhone });
      if (!agent) {
        agent = await Agent.findOne(); // Fallback to existing agent in database
      }
      if (!agent) {
        agent = await Agent.create({
          name: 'Annonceur Particulier',
          company: 'Particulier',
          email: `contact_${Date.now()}@makan.dz`,
          phone: effectivePhone,
          address: `${effectiveCommune}, ${effectiveWilaya}, Algérie`
        });
      }
    }

    // Coordinates resolution for Algeria
    let propertyCoordinates = [3.0588, 36.7538]; // Algiers default [lng, lat]
    if (Array.isArray(coordinates) && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
      propertyCoordinates = [Number(coordinates[0]), Number(coordinates[1])];
    } else {
      const wLower = effectiveWilaya.toLowerCase();
      if (wLower.includes('oran')) propertyCoordinates = [-0.6331, 35.6987];
      else if (wLower.includes('constantine')) propertyCoordinates = [6.6147, 36.365];
      else if (wLower.includes('annaba')) propertyCoordinates = [7.7667, 36.9];
      else if (wLower.includes('tipaza')) propertyCoordinates = [2.4475, 36.5897];
      else if (wLower.includes('blida')) propertyCoordinates = [2.8277, 36.4701];
      else if (wLower.includes('tizi')) propertyCoordinates = [4.0459, 36.7118];
      else if (wLower.includes('béjaïa') || wLower.includes('bejaia')) propertyCoordinates = [5.0567, 36.7509];
      else if (wLower.includes('sétif') || wLower.includes('setif')) propertyCoordinates = [5.4137, 36.1911];
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
    ];

    const property = await Property.create({
      title: title || `Superbe ${normalizedType} à ${effectiveCommune}`,
      description: description || 'Magnifique bien immobilier situé en Algérie.',
      price: effectivePrice,
      rentOrSale: normalizedRentOrSale,
      type: normalizedType,
      status: 'available',
      address: effectiveAddress,
      commune: effectiveCommune,
      wilaya: effectiveWilaya,
      city: effectiveCommune,
      state: effectiveWilaya,
      zip: zip || '16000',
      location: {
        type: 'Point',
        coordinates: propertyCoordinates
      },
      beds: parsedBeds,
      baths: Number(baths) || 1,
      sqm: effectiveSqm,
      sqft: effectiveSqm,
      features: Array.isArray(features) && features.length > 0 ? features : ['Climatisation', 'Chauffage central', 'Bâche à eau', 'Ascenseur'],
      images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
      agentId: agent ? agent._id : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Propriété créée et publiée avec succès !',
      property
    });
  } catch (error) {
    console.error('createProperty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getPropertiesInRadius,
  createProperty
};