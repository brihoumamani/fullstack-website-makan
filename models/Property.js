// makan-backend/models/Property.js
const mongoose = require('mongoose');
require('./Agent');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  rentOrSale: { type: String, enum: ['sale', 'rent', 'daily_rental'], required: true },
  type: { type: String, enum: ['apartment', 'house', 'villa', 'land', 'commercial'], required: true },
  status: { type: String, enum: ['available', 'sold', 'rented'], default: 'available' },
  
  // Algerian Address Structure
  address: { type: String, required: true },
  commune: { type: String }, // e.g. Hydra, Sidi Yahia, Akid Lotfi
  wilaya: { type: String },  // e.g. Alger, Oran, Constantine, Annaba
  city: { type: String },    // Backward-compatibility alias for Commune/Wilaya
  state: { type: String },   // Backward-compatibility alias for Wilaya
  zip: { type: String },     // Postal Code (e.g. 16035, 31000)
  
  // GeoJSON configuration for map clustering/search (Default center: Algiers [3.0588, 36.7538])
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // Format: [longitude, latitude]
  },

  // Property features
  beds: { type: Number, required: true },
  baths: { type: Number, required: true },
  sqm: { type: Number }, // Square meters (m²) - Standard in Algeria
  sqft: { type: Number }, // Maintained for backward compatibility (represents m²)
  features: [{ type: String }], // Array of strings e.g., ["Bâche à eau", "Chauffage central", "Climatisation"]
  
  images: [{ type: String }], // Array of Cloudinary URLs
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' } // Link to the Agent
}, { timestamps: true });

// CRITICAL: Create a 2dsphere index for Mapbox geospatial queries
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);