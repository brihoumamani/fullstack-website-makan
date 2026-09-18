// makan-backend/models/Lead.js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Logged-in user who sent the inquiry
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Property inquired about
  recipientAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' }, // Agent receiving inquiry
  status: { type: String, enum: ['Nouveau', 'Contacté', 'En cours', 'Fermé'], default: 'Nouveau' },
  replyMessage: { type: String },
  replyDate: { type: Date },
  source: { type: String, default: 'website' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);