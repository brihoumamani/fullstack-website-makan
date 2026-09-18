// makan-backend/models/Agent.js
const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  photo: { type: String }, // This will hold our Cloudinary image URL later
  bio: { type: String },
  license: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);