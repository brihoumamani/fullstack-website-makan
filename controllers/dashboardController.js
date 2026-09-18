// makan-backend/controllers/dashboardController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Agent = require('../models/Agent');

// Helper to sanitize user object
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  membershipType: user.membershipType,
  companyName: user.companyName,
  phone: user.phone,
  avatar: user.avatar,
  hasAdvertiserProfile: user.hasAdvertiserProfile || false,
  activeDashboardMode: user.activeDashboardMode || 'client',
  advertiserProfile: user.advertiserProfile || {},
  wilaya: user.wilaya || '',
  commune: user.commune || '',
  address: user.address || '',
  emailConsent: user.emailConsent || false,
  smsConsent: user.smsConsent || false,
  favorites: user.favorites || []
});

// @desc    Get dashboard metrics & overview stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    const totalFavorites = user.favorites ? user.favorites.length : 0;

    // Find user's agent profile if exists
    let agent = await Agent.findOne({ email: user.email });
    let query = {};
    if (agent) {
      query = { agentId: agent._id };
    }

    const totalListings = await Property.countDocuments(query);
    const activeListings = await Property.countDocuments({ ...query, status: 'available' });
    const soldRentedListings = await Property.countDocuments({ ...query, status: { $in: ['sold', 'rented'] } });
    
    // Total leads inquiries
    const totalLeads = await Lead.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        favoritesCount: totalFavorites,
        scheduledVisitsCount: 3,
        activeInquiriesCount: totalLeads,
        totalListings,
        activeListings,
        soldRentedListings,
        totalViews: totalListings * 142 + 85
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle between Client & Advertiser mode
// @route   POST /api/dashboard/toggle-mode
// @access  Private
const toggleDashboardMode = async (req, res) => {
  try {
    const { targetMode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    if (targetMode === 'advertiser' && !user.hasAdvertiserProfile) {
      return res.status(200).json({
        success: false,
        requireOnboarding: true,
        message: 'Veuillez compléter votre profil annonceur pour accéder à cet espace.'
      });
    }

    const newMode = targetMode === 'advertiser' ? 'advertiser' : 'client';
    user.activeDashboardMode = newMode;
    await user.save();

    res.status(200).json({
      success: true,
      mode: newMode,
      user: formatUser(user),
      message: `Mode basculé avec succès vers : ${newMode === 'advertiser' ? 'Annonceur' : 'Client'}`
    });
  } catch (error) {
    console.error('toggleDashboardMode error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete Advertiser Onboarding
// @route   POST /api/dashboard/onboarding
// @access  Private
const completeAdvertiserOnboarding = async (req, res) => {
  try {
    const { agencyName, phone, wilaya, commune, licenseNumber, bio } = req.body;

    if (!agencyName || !phone || !wilaya) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l’agence, le numéro de téléphone et la Wilaya sont obligatoires.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    user.hasAdvertiserProfile = true;
    user.activeDashboardMode = 'advertiser';
    user.role = user.role === 'admin' ? 'admin' : 'agent';
    user.companyName = agencyName;
    user.phone = phone;
    user.wilaya = wilaya;
    user.commune = commune || '';
    user.advertiserProfile = {
      agencyName,
      phone,
      wilaya,
      commune: commune || '',
      licenseNumber: licenseNumber || '',
      bio: bio || ''
    };

    await user.save();

    // Also ensure Agent record exists or is updated
    let agent = await Agent.findOne({ email: user.email });
    if (!agent) {
      agent = await Agent.create({
        name: user.name,
        company: agencyName,
        email: user.email,
        phone: phone,
        address: `${commune ? commune + ', ' : ''}${wilaya}, Algérie`,
        avatar: user.avatar
      });
    } else {
      agent.company = agencyName;
      agent.phone = phone;
      agent.address = `${commune ? commune + ', ' : ''}${wilaya}, Algérie`;
      await agent.save();
    }

    res.status(200).json({
      success: true,
      message: 'Félicitations ! Votre profil annonceur a été activé avec succès.',
      user: formatUser(user)
    });
  } catch (error) {
    console.error('completeAdvertiserOnboarding error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's favorites
// @route   GET /api/dashboard/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: { path: 'agentId' }
    });

    // Safely filter out null/deleted items
    const validFavorites = (user?.favorites || []).filter(Boolean);

    res.status(200).json({
      success: true,
      favorites: validFavorites
    });
  } catch (error) {
    console.error('getFavorites error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle favorite item
// @route   POST /api/dashboard/favorites/:id
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { propertyData } = req.body || {};
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const isValidId = mongoose.Types.ObjectId.isValid(propertyId);
    let targetProperty = null;

    if (isValidId) {
      targetProperty = await Property.findById(propertyId);
    }

    // If not found by ObjectId and propertyData has title, look up by title or create property
    if (!targetProperty && propertyData?.title) {
      targetProperty = await Property.findOne({ title: propertyData.title.trim() });
      if (!targetProperty) {
        const agent = await Agent.findOne();
        targetProperty = await Property.create({
          title: propertyData.title.trim(),
          description: propertyData.description || 'Bien immobilier de qualité en Algérie.',
          price: Number(propertyData.price) || 25000000,
          rentOrSale: propertyData.rentOrSale || 'sale',
          type: propertyData.type || 'apartment',
          status: 'available',
          address: propertyData.address || `${propertyData.commune || 'Centre'}, ${propertyData.wilaya || 'Alger'}`,
          commune: propertyData.commune || 'Hydra',
          wilaya: propertyData.wilaya || 'Alger',
          city: propertyData.commune || propertyData.wilaya || 'Alger',
          state: propertyData.wilaya || 'Alger',
          zip: '16000',
          location: {
            type: 'Point',
            coordinates: [3.0588, 36.7538]
          },
          beds: Number(propertyData.beds) || 3,
          baths: Number(propertyData.baths) || 2,
          sqm: Number(propertyData.sqm || propertyData.sqft) || 120,
          sqft: Number(propertyData.sqm || propertyData.sqft) || 120,
          features: Array.isArray(propertyData.features) && propertyData.features.length > 0 ? propertyData.features : ['Climatisation', 'Chauffage Central', 'Bâche à Eau'],
          images: Array.isArray(propertyData.images) && propertyData.images.length > 0 ? propertyData.images : (propertyData.image ? [propertyData.image] : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']),
          agentId: agent ? agent._id : undefined
        });
      }
    }

    // Fallback if not found and not a valid ObjectId: try finding by title or matching rentOrSale
    if (!targetProperty && !isValidId) {
      targetProperty = await Property.findOne();
    }

    const effectiveId = targetProperty ? targetProperty._id : (isValidId ? propertyId : null);

    if (!effectiveId) {
      return res.status(400).json({
        success: false,
        message: 'Bien immobilier introuvable ou identifiant invalide.'
      });
    }

    const isFav = user.favorites.some((fav) => fav.toString() === effectiveId.toString());
    if (isFav) {
      user.favorites = user.favorites.filter((fav) => fav.toString() !== effectiveId.toString());
    } else {
      user.favorites.push(effectiveId);
    }

    await user.save();

    // Re-populate favorites for fresh response
    const updatedUser = await User.findById(user._id).populate({
      path: 'favorites',
      populate: { path: 'agentId' }
    });

    res.status(200).json({
      success: true,
      isFavorite: !isFav,
      favorites: (updatedUser.favorites || []).filter(Boolean),
      effectiveId: effectiveId.toString(),
      message: !isFav ? 'Ajouté aux favoris' : 'Retiré des favoris'
    });
  } catch (error) {
    console.error('toggleFavorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Advertiser's listings
// @route   GET /api/dashboard/listings
// @access  Private
const getMyListings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const agent = await Agent.findOne({ email: user.email });

    let listings = [];
    if (agent) {
      listings = await Property.find({ agentId: agent._id }).sort({ createdAt: -1 });
    }
    
    // If no specific agent properties yet, retrieve recent listings for demo context
    if (listings.length === 0) {
      listings = await Property.find().limit(6).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('getMyListings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Property Listing
// @route   POST /api/dashboard/properties
// @access  Private
const createProperty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get or create agent
    let agent = await Agent.findOne({ email: user.email });
    if (!agent) {
      agent = await Agent.create({
        name: user.name,
        company: user.advertiserProfile?.agencyName || user.companyName || 'Agence Immobilière',
        email: user.email,
        phone: user.phone || '+213 550 00 00 00',
        avatar: user.avatar
      });
    }

    const {
      title,
      description,
      price,
      rentOrSale,
      type,
      address,
      commune,
      wilaya,
      zip,
      beds,
      baths,
      sqm,
      features,
      images,
      coordinates
    } = req.body;

    if (!title || !price || !rentOrSale || !type || !wilaya) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner tous les champs obligatoires (Titre, Prix, Type d’offre, Catégorie, Wilaya).'
      });
    }

    // Coordinates fallback to Algiers if missing or invalid
    let propertyCoordinates = [3.0588, 36.7538];
    if (Array.isArray(coordinates) && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
      propertyCoordinates = [Number(coordinates[0]), Number(coordinates[1])];
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
    ];

    const newProperty = await Property.create({
      title,
      description: description || 'Magnifique bien immobilier situé en Algérie avec finitions de qualité.',
      price: Number(price),
      rentOrSale: rentOrSale || 'sale',
      type: type || 'apartment',
      status: 'available',
      address: address || `${commune || 'Centre'}, ${wilaya}`,
      commune: commune || '',
      wilaya: wilaya || 'Alger',
      city: commune || wilaya,
      state: wilaya,
      zip: zip || '16000',
      location: {
        type: 'Point',
        coordinates: propertyCoordinates
      },
      beds: Number(beds) || 3,
      baths: Number(baths) || 1,
      sqm: Number(sqm) || 120,
      sqft: Number(sqm) || 120,
      features: Array.isArray(features) ? features : ['Climatisation', 'Chauffage central', 'Bâche à eau', 'Ascenseur'],
      images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
      agentId: agent._id
    });

    res.status(201).json({
      success: true,
      message: 'Propriété publiée avec succès !',
      property: newProperty
    });
  } catch (error) {
    console.error('createProperty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Listing Status (Available / Sold / Rented)
// @route   PATCH /api/dashboard/properties/:id/status
// @access  Private
const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold', 'rented'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable' });
    }

    res.status(200).json({
      success: true,
      message: `Statut mis à jour : ${status}`,
      property
    });
  } catch (error) {
    console.error('updatePropertyStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Full Property Listing
// @route   PUT /api/dashboard/properties/:id
// @access  Private
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable' });
    }

    const {
      title,
      description,
      price,
      rentOrSale,
      type,
      status,
      address,
      commune,
      wilaya,
      zip,
      beds,
      baths,
      sqm,
      features,
      images,
      coordinates
    } = req.body;

    if (title !== undefined) property.title = title;
    if (description !== undefined) property.description = description;
    if (price !== undefined && !isNaN(price)) property.price = Number(price);
    if (rentOrSale !== undefined) property.rentOrSale = rentOrSale;
    if (type !== undefined) property.type = type;
    if (status !== undefined) property.status = status;
    if (address !== undefined) property.address = address;
    if (commune !== undefined) property.commune = commune;
    if (wilaya !== undefined) {
      property.wilaya = wilaya;
      property.state = wilaya;
    }
    if (commune) property.city = commune;
    if (zip !== undefined) property.zip = zip;
    if (beds !== undefined && !isNaN(beds)) property.beds = Number(beds);
    if (baths !== undefined && !isNaN(baths)) property.baths = Number(baths);
    if (sqm !== undefined && !isNaN(sqm)) {
      property.sqm = Number(sqm);
      property.sqft = Number(sqm);
    }
    if (features !== undefined && Array.isArray(features)) property.features = features;
    if (images !== undefined && Array.isArray(images)) property.images = images;
    if (Array.isArray(coordinates) && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
      property.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])]
      };
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Annonce modifiée avec succès !',
      property
    });
  } catch (error) {
    console.error('updateProperty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Property Listing
// @route   DELETE /api/dashboard/properties/:id
// @access  Private
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable' });
    }

    res.status(200).json({
      success: true,
      message: 'Annonce supprimée avec succès'
    });
  } catch (error) {
    console.error('deleteProperty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Client Requests / Leads for Advertiser
// @route   GET /api/dashboard/requests
// @access  Private
const getClientRequests = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate('propertyId', 'title price wilaya commune images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    console.error('getClientRequests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Scheduled Visits & Appointments
// @route   GET /api/dashboard/visits
// @access  Private
const getVisits = async (req, res) => {
  try {
    // Sample structured visits localized for Algeria
    const visits = [
      {
        id: 'vis-101',
        propertyName: 'Appartement Haut Standing F4',
        location: 'Hydra, Alger',
        clientName: 'Karim Bouzid',
        clientPhone: '+213 550 12 34 56',
        date: '2026-09-18',
        time: '14:30',
        status: 'confirmed',
        type: 'Visite physique'
      },
      {
        id: 'vis-102',
        propertyName: 'Villa Moderne avec Piscine',
        location: 'Canastel, Oran',
        clientName: 'Amina Mansouri',
        clientPhone: '+213 661 78 90 12',
        date: '2026-09-20',
        time: '11:00',
        status: 'pending',
        type: 'Visite guidée'
      },
      {
        id: 'vis-103',
        propertyName: 'Duplex avec Vue Mer Panoramique',
        location: 'Ain Benian, Alger',
        clientName: 'Yacine Belkacem',
        clientPhone: '+213 770 44 55 66',
        date: '2026-09-15',
        time: '16:00',
        status: 'completed',
        type: 'Visite physique'
      }
    ];

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.error('getVisits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update User Profile & Preferences
// @route   PUT /api/dashboard/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      wilaya,
      commune,
      address,
      companyName,
      emailConsent,
      smsConsent,
      advertiserProfile
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (wilaya !== undefined) user.wilaya = wilaya;
    if (commune !== undefined) user.commune = commune;
    if (address !== undefined) user.address = address;
    if (companyName !== undefined) user.companyName = companyName;
    if (emailConsent !== undefined) user.emailConsent = emailConsent;
    if (smsConsent !== undefined) user.smsConsent = smsConsent;

    if (advertiserProfile && typeof advertiserProfile === 'object') {
      user.advertiserProfile = {
        ...user.advertiserProfile,
        ...advertiserProfile
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      user: formatUser(user)
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's sent inquiries / contacts (Client Mode)
// @route   GET /api/dashboard/my-messages
// @access  Private
const getMyMessages = async (req, res) => {
  try {
    const user = req.user;
    const leads = await Lead.find({
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    })
      .populate('propertyId', 'title price rentOrSale type commune wilaya beds baths sqm images status')
      .populate('recipientAgentId', 'name company phone photo avatar address email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      messages: leads
    });
  } catch (error) {
    console.error('getMyMessages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send new client inquiry
// @route   POST /api/dashboard/my-messages
// @access  Private
const sendClientMessage = async (req, res) => {
  try {
    const user = req.user;
    const { propertyId, message, recipientAgentId, phone } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message requis' });
    }

    let agentId = recipientAgentId || null;
    if (propertyId && !agentId) {
      const prop = await Property.findById(propertyId);
      if (prop?.agentId) {
        agentId = prop.agentId;
      }
    }

    const lead = await Lead.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: phone || user.phone || '',
      message: message.trim(),
      propertyId: propertyId || null,
      recipientAgentId: agentId,
      status: 'Nouveau'
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate('propertyId', 'title price rentOrSale type commune wilaya beds baths sqm images status')
      .populate('recipientAgentId', 'name company phone photo avatar address email');

    res.status(201).json({
      success: true,
      message: 'Demande envoyée avec succès',
      data: populatedLead
    });
  } catch (error) {
    console.error('sendClientMessage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a client request (Advertiser Mode)
// @route   POST /api/dashboard/requests/:id/reply
// @access  Private
const replyToRequest = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Veuillez saisir une réponse' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Demande introuvable' });
    }

    lead.replyMessage = replyMessage.trim();
    lead.replyDate = new Date();
    lead.status = 'Contacté';
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Réponse enregistrée avec succès',
      lead
    });
  } catch (error) {
    console.error('replyToRequest error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
